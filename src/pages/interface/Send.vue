<template>
  <Headline
    title="Send"
    parent="home"
  />

  <div
    class="pb-10 mt-8 border-b text-carbon dark:text-silver-polish border-cerebral-grey dark:border-midnight-express"
  >
    <div class="lg:align-baseline lg:m-auto lg:grid lg:grid-flow-col lg:grid-cols-2 lg:gap-16 flex flex-wrap items-center">
      <div class="w-full lg:h-full">
        <!-- TODO: when localizing, remove the v-if, the pluralization should be done in the localizer -->
        <div
          v-if="state.transfers.length <= 1"
          class="mb-2 dark:text-silver-polish"
        >
          {{ $t("InterfaceHomeSend.section1.header1") }}
        </div>

        <div
          v-else
          class="mb-2 dark:text-silver-polish"
        >
          {{ $t("InterfaceTransactionDetails.transfers") }}
        </div>

        <div
          class="p-4 bg-white border rounded shadow-md dark:bg-ruined-smores border-jupiter dark:border-midnight-express"
        >
          <TransferForm
            v-model:to="state.transfer.to"
            v-model:asset="state.transfer.asset"
            v-model:amount="state.transfer.amount"
            v-model:usd="state.transfer.usd"
          />
        </div>
      </div>

      <div class="lg:mt-2 lg:h-full w-full mt-4 mb-2 md:p-0">
        <p class="mb-2">
          {{ $t("InterfaceSend.options") }}
        </p>
        <div class="p-8 pr-10 pl-10 z-10 relative bg-white border rounded shadow-md dark:bg-ruined-smores border-jupiter dark:border-midnight-express w-full">
          <OptionalMemo
            v-model="state.memo"
          />

          <OptionalHbarInput @update:model-value="updateMaxFee" />

          <p class="mt-4 p-4 italic text-squant dark:text-silver-polish dark:bg-dreamless-sleep rounded shadow-md border border-transparent dark:border-midnight-express">
            {{ $t("InterfaceSend.max.transaction.fee") }}
          </p>
        </div>
      </div>
    </div>

    <!-- TODO: Enable Multiple Asset Transfers -->
    <!-- <Button
      color="white"
      class="p-2 mt-8 w-52"
      @click="openAddModal"
    >
      {{ $t("BaseButton.addTransfer1") }}
    </Button>-->
  </div>

  <div
    v-if="state.generalErrorText != null"
    class="px-4 py-3 mx-auto mt-10 -mb-8 rounded bg-unburdened-pink w-max"
  >
    <div class="text-center text-harlocks-cape">
      {{ state.generalErrorText }}
    </div>
  </div>

  <!-- bottom buttons section -->
  <div class="flex flex-col items-center w-7/12 m-auto mt-10 mb-10">
    <Button
      color="green"
      class="w-full py-3 mt-6"
      :disabled="!sendValid"
      :busy="state.sendBusyText != null"
      @click="onSend"
    >
      {{ state.sendBusyText ?? "Send" }}
    </Button>

    <Button 
      color="white" 
      class="py-2 mt-4 text-sm px-9" 
      @click="onCancel"
    >
      {{ $t("BaseButton.cancel") }}
    </Button>
  </div>

  <ProgressModal 
    :is-visible="state.showIPModal" 
    :title="$t('InterfaceSend.modal.sending')"
  />

  <Modal
    :is-visible="state.showConfirmModal"
    title="Success"
    @close="closeConfirmModal"
  >
    {{ success }}
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
} from "vue";
import { BigNumber } from "bignumber.js";
import type { TokenId, TokenInfo } from "@hashgraph/sdk";
import { AccountId, Hbar } from "@hashgraph/sdk";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { transfer } from "src/services/impl/hedera/client/transfer";

import Headline from "../../components/interface/Headline.vue";
import TransferForm from "../../components/interface/TransferForm.vue";
import Button from "../../components/base/Button.vue";
import ProgressModal from "../../components/interface/ProgressModal.vue";
import Modal from "../../components/interface/Modal.vue";
import OptionalMemo from "../../components/interface/OptionalMemo.vue";
import OptionalHbarInput from "../../components/interface/OptionalHbarInput.vue";
import { useStore } from "../../store";
// import { transfer } from "src/services/impl/hedera/client/transfer";

export interface Transfer {
  to?: AccountId;
  asset: string; // "HBAR" or token ID (string)
  amount?: BigNumber;
  usd?: string;
}

export default defineComponent({
  name: "Send",
  components: {
    Button,
    Headline,
    TransferForm,
    ProgressModal,
    Modal,
    OptionalMemo,
    OptionalHbarInput
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const i18n = useI18n();
    const hashgraph = ref<typeof import("@hashgraph/sdk") | null>(null);

    const success = computed( ()=> {
      if(state.transfer.asset === "HBAR"){
        return `${i18n.t("Modal.Send.SuccessfullyTransferred")} ${amount.value} ${i18n.t("Modal.Send.ToAccount")}: ${state.transfer.to?.toString()}`
      }
      return `${i18n.t("Modal.Send.SuccessfullyTransferred")} ${parseFloat(new BigNumber(state.transfer.amount ?? 0).toFixed(state.decimals))} ${state.symbol} ${i18n.t("InterfaceSend.modal.of")} ${state.tokenType} ${i18n.t("Modal.Send.ToAccount")}: ${state.transfer.to?.toString()}`
    });

    onMounted(async () => {
      hashgraph.value = await import("@hashgraph/sdk");
    });

    let state = reactive({
      accountId: store.accountId,
      generalErrorText: null as string | null,
      sendBusyText: null as string | null,
      indexToEdit: 0,
      showEditModal: false,
      memo: "" as string,
      maxFee: null as Hbar | null | undefined,
      showAddModal: false,
      showConfirmModal: false,
      showIPModal: false,
      transfer: {
        to: undefined,
        asset: "HBAR",
        amount: undefined
      } as Transfer,
      transfers: [] as Transfer[],
      decimals: 0,
      symbol: null as string | null | undefined,
      tokenType: null as string | null | undefined
    });

    const sendValid = computed(
      () => state.transfer.to != null && state.transfer.amount != null
    );

    const amount = computed(() => {
      let fromTinybar = new Hbar(state.transfer.amount / 100000000);
      return fromTinybar;
    });

    function openConfirmModal(): void {
      state.showIPModal = false;
      state.showConfirmModal = true;
    }

    function closeConfirmModal(): void {
      state.showConfirmModal = false;
      router.back();
    }

    async function onSend(): Promise<void> {

      if (store.client == null) return;

      state.showIPModal = true;
      state.sendBusyText = "Executing transaction …";
      state.generalErrorText = null;

      try {
        await store.client.transfer({
          transfers: [state.transfer],
          memo: state.memo ?? "",
          maxFee: state.maxFee?.toBigNumber() ?? new Hbar(2).toBigNumber(),
          onBeforeConfirm() {
            state.sendBusyText = "Waiting for confirmation …";
          },
        });

        void store.requestAccountBalance();

        //get token information if asset is not Hbar
        if(state.transfer.asset !== "HBAR"){
          const tokenInfo = await getTokenInfo(state.transfer.asset);
          state.decimals = tokenInfo?.decimals ?? 0;
          state.symbol = tokenInfo?.symbol;
          state.tokenType = tokenInfo?.name ;
        }
        // go back to home
        // goal is to see the now PENDING transaction
        // so we can watch it "reach consensus"
        openConfirmModal();
      } catch (err) {
        state.showIPModal = false;
        state.generalErrorText = await store.errorMessage(err);
      } finally {
        state.sendBusyText = null;
      }
    }

    function removeTransfer(index: number) {
      state.transfers.splice(index, 1);
    }

    function onCancel() {
      router.back();
    }

    function updateMaxFee(fee: Hbar): void {
      state.maxFee = fee;
    }

    async function getTokenInfo(token: string | TokenId): Promise<TokenInfo | undefined>{
      return await store.client?.getTokenInfo({token: token});
    }

    return {
      state,
      sendValid,
      onSend,
      removeTransfer,
      onCancel,
      updateMaxFee,
      openConfirmModal,
      closeConfirmModal,
      amount,
      success
    };
  },
});
</script>
