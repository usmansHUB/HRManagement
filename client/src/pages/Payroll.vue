<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { usePayrollStore } from '../stores/payroll';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { DollarSign, FileText, CheckCircle2, ChevronRight, History } from 'lucide-vue-next';

const payrollStore = usePayrollStore();
const authStore = useAuthStore();
const { addToast } = useToast();

const currencySymbol = 'Rs. ';

const activeTab = ref('run'); // 'run' | 'history'

const selectedMonth = ref(new Date().getMonth() + 1); // 1-12
const selectedYear = ref(new Date().getFullYear());

const draftPayrolls = computed(() => payrollStore.draftPayrolls);
const payrollHistory = computed(() => payrollStore.history);
const isLoading = computed(() => payrollStore.isLoading);

const loadPayrollData = () => {
  if (activeTab.value === 'run') {
    payrollStore.fetchPayrollDraft({
      month: selectedMonth.value,
      year: selectedYear.value,
    });
  } else {
    payrollStore.fetchPayrollHistory();
  }
};

watch([activeTab, selectedMonth, selectedYear], () => {
  loadPayrollData();
});

const localPayrolls = ref([]);

watch(draftPayrolls, (newVal) => {
  if (newVal) {
    localPayrolls.value = newVal.map(item => {
      const basicSalary = item.basicSalary || 0;
      const allowancesTotal = (item.allowances || []).reduce((acc, a) => acc + (a.amount || 0), 0);
      const deductionsTotal = (item.deductions || []).reduce((acc, d) => acc + (d.amount || 0), 0);
      const taxAmount = item.taxAmount || 0;
      return {
        ...item,
        basicSalary,
        allowancesTotal,
        deductionsTotal,
        taxAmount
      };
    });
  } else {
    localPayrolls.value = [];
  }
}, { immediate: true });

const editingRowId = ref(null);

const startEditRow = (id) => {
  editingRowId.value = id;
};

const cancelEditRow = () => {
  editingRowId.value = null;
  loadPayrollData();
};

const executeSinglePayrollSave = async (item) => {
  try {
    const payload = {
      month: selectedMonth.value,
      year: selectedYear.value,
      payrolls: [{
        employeeId: item.employeeId._id,
        basicSalary: item.basicSalary,
        allowances: [{ name: 'Allowances', amount: item.allowancesTotal || 0 }],
        deductions: [{ name: 'Deductions', amount: item.deductionsTotal || 0 }],
        taxAmount: item.taxAmount || 0,
      }]
    };
    const result = await payrollStore.processPayroll(payload);
    if (result.success) {
      addToast(`Payslip for ${item.employeeId.firstName} approved successfully!`, 'success');
      editingRowId.value = null;
      loadPayrollData();
    } else {
      addToast(result.message, 'error');
    }
  } catch (err) {
    addToast('Failed to save payslip.', 'error');
  }
};

const executePayrollRun = async () => {
  if (localPayrolls.value.length === 0) return addToast('No employees found to process', 'warning');

  const payload = {
    month: selectedMonth.value,
    year: selectedYear.value,
    payrolls: localPayrolls.value.map(item => ({
      employeeId: item.employeeId._id,
      basicSalary: item.basicSalary,
      allowances: [{ name: 'Allowances', amount: item.allowancesTotal || 0 }],
      deductions: [{ name: 'Deductions', amount: item.deductionsTotal || 0 }],
      taxAmount: item.taxAmount || 0,
    })),
  };

  const result = await payrollStore.processPayroll(payload);
  if (result.success) {
    addToast('Payroll processed successfully! Slips are now generated/updated.', 'success');
    loadPayrollData();
  } else {
    addToast(result.message, 'error');
  }
};

const triggerPayslipDownload = async (id) => {
  addToast('Generating payslip PDF...', 'info');
  const result = await payrollStore.downloadPayslip(id);
  if (result.success) {
    addToast('Payslip downloaded successfully!', 'success');
  } else {
    addToast('Failed to download PDF payslip.', 'error');
  }
};

onMounted(async () => {
  loadPayrollData();
  if (!authStore.companySettings) {
    await authStore.fetchCompanySettings();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Title banner -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Payroll Management</h1>
        <p class="text-slate-400 text-xs mt-1">Review basic salaries, allowances, taxes, and generate PDF payslips.</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-brand-border/60">
      <button 
        @click="activeTab = 'run'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'run' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Run Monthly Payroll
      </button>
      <button 
        @click="activeTab = 'history'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'history' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Payroll & Payslip History
      </button>
    </div>

    <!-- ==================== Tab 1: Run Payroll worksheet ==================== -->
    <div v-if="activeTab === 'run'" class="space-y-6">
      
      <!-- Date select controls -->
      <div class="flex flex-wrap items-center justify-between p-4 bg-brand-card/30 border border-brand-border/60 rounded-xl glass-panel gap-4">
        <div class="flex items-center gap-3">
          <select v-model="selectedMonth" class="bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2.5 rounded-lg outline-none cursor-pointer">
            <option v-for="m in 12" :key="m" :value="m">
              {{ ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m-1] }}
            </option>
          </select>
          <select v-model="selectedYear" class="bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2.5 rounded-lg outline-none cursor-pointer">
            <option v-for="y in [2024, 2025, 2026, 2027]" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div class="flex items-center gap-3">
          <div v-if="draftPayrolls.length > 0 && draftPayrolls[0]?.status === 'paid'" class="text-emerald-400 text-xs font-semibold px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1 font-mono">
            ✓ Status: Paid
          </div>
          <HrmButton 
            v-if="draftPayrolls.length > 0"
            variant="primary" 
            @click="executePayrollRun"
          >
            <CheckCircle2 class="w-4 h-4" />
            {{ draftPayrolls[0]?.status === 'paid' ? 'Update & Save Payroll' : 'Approve & Run Payroll' }}
          </HrmButton>
        </div>
      </div>

      <!-- Payroll Draft calculation table -->
      <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-md font-bold text-white">Payroll Worksheet</h3>
          <span class="text-xs text-slate-400 font-mono">Month: {{ selectedMonth }}/{{ selectedYear }}</span>
        </div>

        <HrmTable :headers="['Employee', 'Base Pay', 'Allowances', 'Deductions', 'Income Tax', 'Net Pay', 'Status', 'Actions']" :items="localPayrolls" :isLoading="isLoading">
          <template #row="{ item }">
            <td class="px-6 py-3.5">
              <div class="text-xs font-semibold text-white leading-none mb-1">{{ item.employeeId?.firstName }} {{ item.employeeId?.lastName }}</div>
              <span class="text-[9px] text-slate-500 font-mono block">{{ item.employeeId?.employeeCode }}</span>
            </td>
            <td class="px-6 py-3.5 text-xs font-mono">
              <div v-if="editingRowId === item.employeeId._id" class="flex items-center gap-1 bg-[#0E1322] border border-brand-border/60 rounded px-1.5 py-0.5 max-w-[140px]">
                <button type="button" @click="item.basicSalary = Math.max(0, item.basicSalary - 5000)" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">-</button>
                <input type="number" v-model.number="item.basicSalary" class="w-12 text-center bg-transparent text-[11px] text-white outline-none border-none p-0 focus:ring-0 font-bold" />
                <button type="button" @click="item.basicSalary = item.basicSalary + 5000" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">+</button>
              </div>
              <span v-else>{{ currencySymbol }}{{ (item.basicSalary || 0).toLocaleString() }}</span>
            </td>
            <td class="px-6 py-3.5 text-xs font-mono text-slate-300">
              <div v-if="editingRowId === item.employeeId._id" class="flex items-center gap-1 bg-[#0E1322] border border-brand-border/60 rounded px-1.5 py-0.5 max-w-[120px]">
                <button type="button" @click="item.allowancesTotal = Math.max(0, item.allowancesTotal - 1000)" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">-</button>
                <input type="number" v-model.number="item.allowancesTotal" class="w-10 text-center bg-transparent text-[11px] text-white outline-none border-none p-0 focus:ring-0 font-bold" />
                <button type="button" @click="item.allowancesTotal = item.allowancesTotal + 1000" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">+</button>
              </div>
              <span v-else>{{ currencySymbol }}{{ (item.allowancesTotal || 0).toLocaleString() }}</span>
            </td>
            <td class="px-6 py-3.5 text-xs font-mono text-slate-400">
              <div v-if="editingRowId === item.employeeId._id" class="flex items-center gap-1 bg-[#0E1322] border border-brand-border/60 rounded px-1.5 py-0.5 max-w-[120px]">
                <button type="button" @click="item.deductionsTotal = Math.max(0, item.deductionsTotal - 1000)" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">-</button>
                <input type="number" v-model.number="item.deductionsTotal" class="w-10 text-center bg-transparent text-[11px] text-white outline-none border-none p-0 focus:ring-0 font-bold" />
                <button type="button" @click="item.deductionsTotal = item.deductionsTotal + 1000" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">+</button>
              </div>
              <span v-else>{{ currencySymbol }}{{ (item.deductionsTotal || 0).toLocaleString() }}</span>
            </td>
            <td class="px-6 py-3.5 text-xs font-mono text-rose-400/90">
              <div v-if="editingRowId === item.employeeId._id" class="flex items-center gap-1 bg-[#0E1322] border border-brand-border/60 rounded px-1.5 py-0.5 max-w-[120px]">
                <button type="button" @click="item.taxAmount = Math.max(0, item.taxAmount - 500)" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">-</button>
                <input type="number" v-model.number="item.taxAmount" class="w-10 text-center bg-transparent text-[11px] text-white outline-none border-none p-0 focus:ring-0 font-bold" />
                <button type="button" @click="item.taxAmount = item.taxAmount + 500" class="text-[10px] text-slate-400 hover:text-white px-1 bg-brand-border/30 rounded select-none font-extrabold cursor-pointer">+</button>
              </div>
              <span v-else>{{ currencySymbol }}{{ (item.taxAmount || 0).toLocaleString() }}</span>
            </td>
            <td class="px-6 py-3.5 text-xs font-mono font-bold text-brand-blue">
              {{ currencySymbol }}{{ Math.round(item.basicSalary + item.allowancesTotal - item.deductionsTotal - item.taxAmount).toLocaleString() }}
            </td>
            <td class="px-6 py-3.5"><HrmBadge :status="item.status || 'draft'" /></td>
            <td class="px-6 py-3.5">
              <div class="flex items-center gap-2">
                <div v-if="editingRowId === item.employeeId._id" class="flex items-center gap-1.5">
                  <button 
                    @click="executeSinglePayrollSave(item)" 
                    class="text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded cursor-pointer font-bold transition"
                  >
                    Approve
                  </button>
                  <button 
                    @click="cancelEditRow" 
                    class="text-[10px] text-slate-400 hover:text-slate-300 px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded cursor-pointer font-bold transition"
                  >
                    Cancel
                  </button>
                </div>
                <div v-else>
                  <button 
                    @click="startEditRow(item.employeeId._id)" 
                    class="text-[10px] text-brand-blue hover:text-blue-400 px-2.5 py-1 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/20 rounded cursor-pointer font-bold transition"
                  >
                    Edit Slip
                  </button>
                </div>
              </div>
            </td>
          </template>
        </HrmTable>
      </div>

    </div>

    <!-- ==================== Tab 2: Payroll history archive ==================== -->
    <div v-else class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
      <h3 class="text-md font-bold text-white mb-6">Historical Slips</h3>

      <HrmTable :headers="['Employee', 'Period', 'Basic Salary', 'Tax Deductions', 'Net Pay Outflow', 'Action']" :items="payrollHistory" :isLoading="isLoading">
        <template #row="{ item }">
          <td class="px-6 py-3.5">
            <div class="text-xs font-semibold text-white">{{ item.employeeId?.firstName }} {{ item.employeeId?.lastName }}</div>
            <span class="text-[9px] text-slate-500 font-mono block mt-0.5">{{ item.employeeId?.employeeCode }}</span>
          </td>
          <td class="px-6 py-3.5 text-xs font-mono">
            {{ ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item.month - 1] }} {{ item.year }}
          </td>
          <td class="px-6 py-3.5 text-xs font-mono">{{ currencySymbol }}{{ (item.basicSalary || 0).toLocaleString() }}</td>
          <td class="px-6 py-3.5 text-xs font-mono text-rose-400">{{ currencySymbol }}{{ (item.taxAmount || 0).toLocaleString() }}</td>
          <td class="px-6 py-3.5 text-xs font-mono font-bold text-brand-blue">{{ currencySymbol }}{{ Math.round(item.netPay || 0).toLocaleString() }}</td>
          <td class="px-6 py-3.5">
            <HrmButton variant="secondary" class="py-1 px-3 text-xs" @click="triggerPayslipDownload(item._id)">
              <FileText class="w-3.5 h-3.5 text-brand-purple" />
              Payslip PDF
            </HrmButton>
          </td>
        </template>
      </HrmTable>
    </div>
  </div>
</template>
