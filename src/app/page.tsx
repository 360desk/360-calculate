'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Users, 
  Receipt, 
  History, 
  Calculator, 
  Settings, 
  Eye, 
  X, 
  ExternalLink,
  BarChart3,
  Contact2,
  Phone,
  Mail,
  Edit3,
  Award,
  Calendar,
  Layers,
  LineChart as LineChartIcon,
  BarChart2,
  Activity,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Lock,
  LogOut,
  KeyRound
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

interface Agent {
  id: string;
  code: string;
  full_name: string;
  commission_rate: number;
  is_active?: boolean;
}

interface ExpenseType {
  id: string;
  name: string;
  default_cost: number;
}

interface ExpenseItem {
  id: string;
  expense_type_id: string;
  custom_description: string;
  amount: number;
}

interface Contact {
  id: string;
  full_name: string;
  contact_type: 'MUSTERI' | 'ORTAK';
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
}

interface TransactionDetailRecord {
  id: string;
  created_at: string;
  transaction_type: string;
  property_price: number;
  tax_rate: number;

  seller_name: string;
  seller_agent_id: string;
  seller_commission_type: string;
  seller_commission_value: number;
  seller_base_commission: number;
  seller_invoice_type: string;
  seller_invoice_amount: number;
  seller_tax_amount: number;
  seller_tax_deduction?: number;
  seller_total_gross_income: number;
  seller_has_partnership: boolean;
  seller_partner_name: string;
  seller_partner_reason: string;
  seller_partner_share: number;
  seller_agent_rate_applied: number;
  seller_agent_gross_earning: number;
  seller_agent_total_expenses: number;
  seller_agent_net_earning: number;
  seller_office_net_share: number;

  buyer_name: string;
  buyer_agent_id: string;
  buyer_commission_type: string;
  buyer_commission_value: number;
  buyer_base_commission: number;
  buyer_invoice_type: string;
  buyer_invoice_amount: number;
  buyer_tax_amount: number;
  buyer_tax_deduction?: number;
  buyer_total_gross_income: number;
  buyer_has_partnership: boolean;
  buyer_partner_name: string;
  buyer_partner_reason: string;
  buyer_partner_share: number;
  buyer_agent_rate_applied: number;
  buyer_agent_gross_earning: number;
  buyer_agent_total_expenses: number;
  buyer_agent_net_earning: number;
  buyer_office_net_share: number;

  total_transaction_gross: number;
  total_office_net_income: number;
}

const formatMoney = (val: number) => {
  if (isNaN(val) || val === null || val === undefined) return '0 TL';
  return `${val.toLocaleString('tr-TR')} TL`;
};

const formatInputDisplay = (val: number) => {
  if (!val && val !== 0) return '';
  return val === 0 ? '' : val.toLocaleString('tr-TR');
};

const parseInputValue = (str: string) => {
  const cleanStr = str.replace(/[^0-9]/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
};

const getTodayISODate = () => {
  return new Date().toISOString().split('T')[0];
};

const PIE_COLORS = ['#d97706', '#10b981', '#3b82f6', '#8b5cf6'];
const MASTER_PASSWORD = 't74B78s03##';

export default function RealEstateCalculator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'calculator' | 'settings' | 'history' | 'analytics' | 'contacts'>('calculator');
  const [taxRate, setTaxRate] = useState<number>(20);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactionsHistory, setTransactionsHistory] = useState<TransactionDetailRecord[]>([]);

  const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>('bar');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'this_year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingExpenseType, setEditingExpenseType] = useState<ExpenseType | null>(null);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TransactionDetailRecord | null>(null);
  const [selectedItemExpenses, setSelectedItemExpenses] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const modalPdfRef = useRef<HTMLDivElement>(null);

  const [newAgentCode, setNewAgentCode] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRate, setNewAgentRate] = useState<number>(50);
  const [newExpName, setNewExpName] = useState('');
  const [newExpCost, setNewExpCost] = useState<number>(0);

  const [transactionDate, setTransactionDate] = useState<string>(getTodayISODate());
  const [propertyPrice, setPropertyPrice] = useState<number>(1000000);
  const [transactionType, setTransactionType] = useState<string>('SATIŞ');

  const [sellerInputMode, setSellerInputMode] = useState<'select' | 'new'>('select');
  const [sellerName, setSellerName] = useState<string>('');
  const [sellerAgentId, setSellerAgentId] = useState<string>('');
  const [sellerCommType, setSellerCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [sellerCommValue, setSellerCommValue] = useState<number>(2);
  const [sellerInvoiceType, setSellerInvoiceType] = useState<'unbilled' | 'full' | 'partial'>('unbilled');
  const [sellerInvoiceAmount, setSellerInvoiceAmount] = useState<number>(0);
  const [sellerHasPartner, setSellerHasPartner] = useState<boolean>(false);
  const [sellerPartnerMode, setSellerPartnerMode] = useState<'select' | 'new'>('select');
  const [sellerPartnerName, setSellerPartnerName] = useState<string>('');
  const [sellerPartnerReason, setSellerPartnerReason] = useState<string>('');
  const [sellerPartnerShare, setSellerPartnerShare] = useState<number>(0);
  const [sellerExpenses, setSellerExpenses] = useState<ExpenseItem[]>([]);

  const [buyerInputMode, setBuyerInputMode] = useState<'select' | 'new'>('select');
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerAgentId, setBuyerAgentId] = useState<string>('');
  const [buyerCommType, setBuyerCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [buyerCommValue, setBuyerCommValue] = useState<number>(2);
  const [buyerInvoiceType, setBuyerInvoiceType] = useState<'unbilled' | 'full' | 'partial'>('unbilled');
  const [buyerInvoiceAmount, setBuyerInvoiceAmount] = useState<number>(0);
  const [buyerHasPartner, setBuyerHasPartner] = useState<boolean>(false);
  const [buyerPartnerMode, setBuyerPartnerMode] = useState<'select' | 'new'>('select');
  const [buyerPartnerName, setBuyerPartnerName] = useState<string>('');
  const [buyerPartnerReason, setBuyerPartnerReason] = useState<string>('');
  const [buyerPartnerShare, setBuyerPartnerShare] = useState<number>(0);
  const [buyerExpenses, setBuyerExpenses] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    const sessionAuth = localStorage.getItem('360ic_auth_token');
    if (sessionAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      localStorage.setItem('360ic_auth_token', 'authenticated');
    } else {
      setAuthError('Girdiğiniz şifre hatalıdır. Lütfen tekrar deneyin.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('360ic_auth_token');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const loadData = async () => {
    const { data: taxData } = await supabase.from('system_settings').select('value').eq('key', 'default_tax_rate').single();
    if (taxData) setTaxRate(Number(taxData.value));

    const { data: agentData } = await supabase.from('agents').select('*').order('code');
    if (agentData) setAgents(agentData);

    const { data: expData } = await supabase.from('expense_types').select('*').order('name');
    if (expData) setExpenseTypes(expData);

    const { data: contactsData } = await supabase.from('contacts').select('*').order('full_name');
    if (contactsData) setContacts(contactsData as Contact[]);

    const { data: transData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (transData) {
      setTransactionsHistory(transData as TransactionDetailRecord[]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const activeAgents = useMemo(() => {
    return agents.filter(a => a.is_active !== false);
  }, [agents]);

  const filteredTransactions = useMemo(() => {
    return transactionsHistory.filter(t => {
      const transDate = new Date(t.created_at);
      const now = new Date();

      if (dateFilter === 'this_month') {
        if (transDate.getMonth() !== now.getMonth() || transDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'this_year') {
        if (transDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && new Date(t.created_at) < new Date(customStartDate)) return false;
        if (customEndDate && new Date(t.created_at) > new Date(customEndDate + 'T23:59:59')) return false;
      }

      if (selectedAgentFilter !== 'all') {
        const isSellerAgent = t.seller_agent_id === selectedAgentFilter;
        const isBuyerAgent = t.buyer_agent_id === selectedAgentFilter;
        if (!isSellerAgent && !isBuyerAgent) return false;
      }

      return true;
    });
  }, [transactionsHistory, dateFilter, customStartDate, customEndDate, selectedAgentFilter]);

  const analyticsSummary = useMemo(() => {
    let totalSalesCount = 0;
    let totalRentCount = 0;
    let totalGrossVolume = 0;
    let totalOfficeNet = 0;
    let totalAgentNetEarnings = 0;

    const agentStats: Record<string, { id: string; name: string; count: number; gross: number; agentNet: number; officeNet: number }> = {};
    const contactVolumeStats: Record<string, { count: number; totalGross: number; role: string }> = {};

    filteredTransactions.forEach(t => {
      if (t.transaction_type === 'SATIŞ') totalSalesCount++;
      else totalRentCount++;

      if (t.seller_agent_id) {
        const ag = agents.find(a => a.id === t.seller_agent_id);
        const name = ag ? `[${ag.code}] ${ag.full_name}` : 'Bilinmeyen Danışman';
        if (!agentStats[t.seller_agent_id]) agentStats[t.seller_agent_id] = { id: t.seller_agent_id, name, count: 0, gross: 0, agentNet: 0, officeNet: 0 };
        agentStats[t.seller_agent_id].count += 1;
        agentStats[t.seller_agent_id].gross += Number(t.seller_base_commission) || 0;
        agentStats[t.seller_agent_id].agentNet += Number(t.seller_agent_net_earning) || 0;
        agentStats[t.seller_agent_id].officeNet += Number(t.seller_office_net_share) || 0;

        if (selectedAgentFilter === t.seller_agent_id) {
          totalAgentNetEarnings += Number(t.seller_agent_net_earning) || 0;
        }
      }

      if (t.buyer_agent_id) {
        const ag = agents.find(a => a.id === t.buyer_agent_id);
        const name = ag ? `[${ag.code}] ${ag.full_name}` : 'Bilinmeyen Danışman';
        if (!agentStats[t.buyer_agent_id]) agentStats[t.buyer_agent_id] = { id: t.buyer_agent_id, name, count: 0, gross: 0, agentNet: 0, officeNet: 0 };
        agentStats[t.buyer_agent_id].count += 1;
        agentStats[t.buyer_agent_id].gross += Number(t.buyer_base_commission) || 0;
        agentStats[t.buyer_agent_id].agentNet += Number(t.buyer_agent_net_earning) || 0;
        agentStats[t.buyer_agent_id].officeNet += Number(t.buyer_office_net_share) || 0;

        if (selectedAgentFilter === t.buyer_agent_id) {
          totalAgentNetEarnings += Number(t.buyer_agent_net_earning) || 0;
        }
      }

      if (selectedAgentFilter === 'all') {
        totalGrossVolume += Number(t.total_transaction_gross) || 0;
        totalOfficeNet += Number(t.total_office_net_income) || 0;
      } else {
        if (t.seller_agent_id === selectedAgentFilter) {
          totalGrossVolume += Number(t.seller_total_gross_income) || 0;
          totalOfficeNet += Number(t.seller_office_net_share) || 0;
        }
        if (t.buyer_agent_id === selectedAgentFilter) {
          totalGrossVolume += Number(t.buyer_total_gross_income) || 0;
          totalOfficeNet += Number(t.buyer_office_net_share) || 0;
        }
      }

      if (t.seller_name && t.seller_name !== 'Belirtilmedi') {
        if (!contactVolumeStats[t.seller_name]) contactVolumeStats[t.seller_name] = { count: 0, totalGross: 0, role: 'Müşteri (Satıcı)' };
        contactVolumeStats[t.seller_name].count += 1;
        contactVolumeStats[t.seller_name].totalGross += Number(t.property_price) || 0;
      }
      if (t.buyer_name && t.buyer_name !== 'Belirtilmedi') {
        if (!contactVolumeStats[t.buyer_name]) contactVolumeStats[t.buyer_name] = { count: 0, totalGross: 0, role: 'Müşteri (Alıcı)' };
        contactVolumeStats[t.buyer_name].count += 1;
        contactVolumeStats[t.buyer_name].totalGross += Number(t.property_price) || 0;
      }
      if (t.seller_partner_name) {
        if (!contactVolumeStats[t.seller_partner_name]) contactVolumeStats[t.seller_partner_name] = { count: 0, totalGross: 0, role: 'Ortak Çalışma' };
        contactVolumeStats[t.seller_partner_name].count += 1;
        contactVolumeStats[t.seller_partner_name].totalGross += Number(t.seller_partner_share) || 0;
      }
    });

    const topAgentsByCount = Object.values(agentStats).sort((a, b) => b.count - a.count);
    const topContactsByVolume = Object.entries(contactVolumeStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalGross - a.totalGross);

    const timelineDataMap: Record<string, { dateLabel: string; gross: number; net: number; agentEarn: number }> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.created_at);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!timelineDataMap[key]) {
        timelineDataMap[key] = {
          dateLabel: date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
          gross: 0,
          net: 0,
          agentEarn: 0
        };
      }

      if (selectedAgentFilter === 'all') {
        timelineDataMap[key].gross += Number(t.total_transaction_gross) || 0;
        timelineDataMap[key].net += Number(t.total_office_net_income) || 0;
      } else {
        if (t.seller_agent_id === selectedAgentFilter) {
          timelineDataMap[key].gross += Number(t.seller_total_gross_income) || 0;
          timelineDataMap[key].net += Number(t.seller_office_net_share) || 0;
          timelineDataMap[key].agentEarn += Number(t.seller_agent_net_earning) || 0;
        }
        if (t.buyer_agent_id === selectedAgentFilter) {
          timelineDataMap[key].gross += Number(t.buyer_total_gross_income) || 0;
          timelineDataMap[key].net += Number(t.buyer_office_net_share) || 0;
          timelineDataMap[key].agentEarn += Number(t.buyer_agent_net_earning) || 0;
        }
      }
    });

    const chartTimelineData = Object.values(timelineDataMap).reverse();

    const pieData = [
      { name: 'Satış İşlemleri', value: totalSalesCount },
      { name: 'Kiralama İşlemleri', value: totalRentCount }
    ];

    return {
      totalTransactions: filteredTransactions.length,
      totalSalesCount,
      totalRentCount,
      totalGrossVolume,
      totalOfficeNet,
      totalAgentNetEarnings,
      topAgentsByCount,
      topContactsByVolume,
      chartTimelineData,
      pieData
    };
  }, [filteredTransactions, agents, selectedAgentFilter]);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Bu işlemi tamamen silmek istediğinize emin misiniz? (Bağlı tüm masraflar ve rapor verileri temizlenecektir)')) return;
    
    await supabase.from('transaction_expenses').delete().eq('transaction_id', id);
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    
    if (!error) {
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
      loadData();
    } else {
      alert('İşlem silinirken hata oluştu: ' + error.message);
    }
  };

  const handleAddAgent = async () => {
    if (!newAgentCode || !newAgentName) return alert('Lütfen danışman kodu ve adını girin.');
    const { error } = await supabase.from('agents').insert({
      code: newAgentCode,
      full_name: newAgentName,
      commission_rate: newAgentRate,
      is_active: true
    });
    if (!error) {
      setNewAgentCode('');
      setNewAgentName('');
      loadData();
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;
    const { error } = await supabase.from('agents').update({
      code: editingAgent.code,
      full_name: editingAgent.full_name,
      commission_rate: editingAgent.commission_rate,
      is_active: editingAgent.is_active
    }).eq('id', editingAgent.id);

    if (!error) {
      setEditingAgent(null);
      loadData();
    } else {
      alert('Danışman güncellenirken hata: ' + error.message);
    }
  };

  const toggleAgentActiveStatus = async (agent: Agent) => {
    const newStatus = !(agent.is_active !== false);
    const { error } = await supabase.from('agents').update({ is_active: newStatus }).eq('id', agent.id);
    if (!error) {
      loadData();
    } else {
      alert('Durum güncellenirken hata: ' + error.message);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Danışmanı tamamen silmek istediğinize emin misiniz? (Öneri: Geçmiş kayıtların korunması için danışmanı Pasife alabilirsiniz)')) return;
    await supabase.from('agents').delete().eq('id', id);
    loadData();
  };

  const handleAddExpenseType = async () => {
    if (!newExpName) return alert('Lütfen gider adını girin.');
    const { error } = await supabase.from('expense_types').insert({
      name: newExpName,
      default_cost: newExpCost
    });
    if (!error) {
      setNewExpName('');
      setNewExpCost(0);
      loadData();
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const handleUpdateExpenseType = async () => {
    if (!editingExpenseType) return;
    const { error } = await supabase.from('expense_types').update({
      name: editingExpenseType.name,
      default_cost: editingExpenseType.default_cost
    }).eq('id', editingExpenseType.id);

    if (!error) {
      setEditingExpenseType(null);
      loadData();
    } else {
      alert('Gider türü güncellenirken hata: ' + error.message);
    }
  };

  const handleDeleteExpenseType = async (id: string) => {
    if (!confirm('Gider türünü silmek istediğinize emin misiniz?')) return;
    await supabase.from('expense_types').delete().eq('id', id);
    loadData();
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    const { error } = await supabase.from('contacts').upsert({
      id: editingContact.id || undefined,
      full_name: editingContact.full_name,
      contact_type: editingContact.contact_type,
      phone: editingContact.phone,
      email: editingContact.email,
      company: editingContact.company,
      notes: editingContact.notes
    });

    if (!error) {
      setEditingContact(null);
      loadData();
    } else {
      alert('Kişi kaydedilirken hata oluştu: ' + error.message);
    }
  };

  const openHistoryDetail = async (item: TransactionDetailRecord) => {
    setSelectedHistoryItem(item);
    const { data: expData } = await supabase.from('transaction_expenses').select('*').eq('transaction_id', item.id);
    setSelectedItemExpenses(expData || []);
  };

  const loadHistoryItemToCalculator = (item: TransactionDetailRecord) => {
    setTransactionDate(item.created_at ? item.created_at.split('T')[0] : getTodayISODate());
    setTransactionType(item.transaction_type);
    setPropertyPrice(Number(item.property_price));
    setTaxRate(Number(item.tax_rate));

    setSellerName(item.seller_name);
    setSellerAgentId(item.seller_agent_id || '');
    setSellerCommType(item.seller_commission_type as any);
    setSellerCommValue(Number(item.seller_commission_value));
    setSellerInvoiceType(item.seller_invoice_type as any);
    setSellerInvoiceAmount(Number(item.seller_invoice_amount));
    setSellerHasPartner(item.seller_has_partnership);
    setSellerPartnerName(item.seller_partner_name || '');
    setSellerPartnerReason(item.seller_partner_reason || '');
    setSellerPartnerShare(Number(item.seller_partner_share));

    setBuyerName(item.buyer_name);
    setBuyerAgentId(item.buyer_agent_id || '');
    setBuyerCommType(item.buyer_commission_type as any);
    setBuyerCommValue(Number(item.buyer_commission_value));
    setBuyerInvoiceType(item.buyer_invoice_type as any);
    setBuyerInvoiceAmount(Number(item.buyer_invoice_amount));
    setBuyerHasPartner(item.buyer_has_partnership);
    setBuyerPartnerName(item.buyer_partner_name || '');
    setBuyerPartnerReason(item.buyer_partner_reason || '');
    setBuyerPartnerShare(Number(item.buyer_partner_share));

    setSelectedHistoryItem(null);
    setActiveTab('calculator');
  };

  const addExpense = (side: 'seller' | 'buyer') => {
    const newItem: ExpenseItem = {
      id: Math.random().toString(),
      expense_type_id: 'custom',
      custom_description: '',
      amount: 0
    };
    if (side === 'seller') setSellerExpenses([...sellerExpenses, newItem]);
    else setBuyerExpenses([...buyerExpenses, newItem]);
  };

  const removeExpense = (side: 'seller' | 'buyer', id: string) => {
    if (side === 'seller') setSellerExpenses(sellerExpenses.filter(e => e.id !== id));
    else setBuyerExpenses(buyerExpenses.filter(e => e.id !== id));
  };

  const handleExpenseTypeChange = (side: 'seller' | 'buyer', itemId: string, selectedTypeId: string) => {
    const updater = (list: ExpenseItem[]) => list.map(item => {
      if (item.id !== itemId) return item;
      if (selectedTypeId === 'custom') {
        return { ...item, expense_type_id: 'custom', custom_description: '', amount: 0 };
      }
      const matched = expenseTypes.find(t => t.id === selectedTypeId);
      return {
        ...item,
        expense_type_id: selectedTypeId,
        custom_description: matched ? matched.name : '',
        amount: matched ? matched.default_cost : 0
      };
    });
    if (side === 'seller') setSellerExpenses(updater(sellerExpenses));
    else setBuyerExpenses(updater(buyerExpenses));
  };

  const updateExpenseField = (side: 'seller' | 'buyer', itemId: string, field: 'custom_description' | 'amount', value: any) => {
    const updater = (list: ExpenseItem[]) => list.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, [field]: value };
    });
    if (side === 'seller') setSellerExpenses(updater(sellerExpenses));
    else setBuyerExpenses(updater(buyerExpenses));
  };

  const selectedSellerAgent = agents.find(a => a.id === sellerAgentId);
  const selectedBuyerAgent = agents.find(a => a.id === buyerAgentId);

  const sellerBaseComm = sellerCommType === 'percentage' 
    ? (propertyPrice * (sellerCommValue || 0)) / 100 
    : (sellerCommValue || 0);

  const effectiveSellerInvoice = sellerInvoiceType === 'full' 
    ? sellerBaseComm 
    : sellerInvoiceType === 'partial' ? (sellerInvoiceAmount || 0) : 0;
  
  const sellerTaxAmount = (effectiveSellerInvoice * taxRate) / 100;
  const sellerTotalGross = sellerBaseComm + sellerTaxAmount;

  const sellerAgentRate = selectedSellerAgent ? selectedSellerAgent.commission_rate : 50;
  const sellerAgentGross = (sellerBaseComm * sellerAgentRate) / 100;
  const sellerTaxDeduction = (effectiveSellerInvoice * 0.25 * sellerAgentRate) / 100;

  const sellerTotalExpenseAmount = sellerExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const sellerPartnerAmount = sellerHasPartner ? (Number(sellerPartnerShare) || 0) : 0;
  
  const sellerAgentNet = Math.max(0, sellerAgentGross - sellerPartnerAmount - sellerTotalExpenseAmount - sellerTaxDeduction);
  const sellerOfficeNet = Math.max(0, sellerBaseComm - sellerAgentGross);

  const buyerBaseComm = buyerCommType === 'percentage' 
    ? (propertyPrice * (buyerCommValue || 0)) / 100 
    : (buyerCommValue || 0);

  const effectiveBuyerInvoice = buyerInvoiceType === 'full' 
    ? buyerBaseComm 
    : buyerInvoiceType === 'partial' ? (buyerInvoiceAmount || 0) : 0;
  
  const buyerTaxAmount = (effectiveBuyerInvoice * taxRate) / 100;
  const buyerTotalGross = buyerBaseComm + buyerTaxAmount;

  const buyerAgentRate = selectedBuyerAgent ? selectedBuyerAgent.commission_rate : 50;
  const buyerAgentGross = (buyerBaseComm * buyerAgentRate) / 100;
  const buyerTaxDeduction = (effectiveBuyerInvoice * 0.25 * buyerAgentRate) / 100;

  const buyerTotalExpenseAmount = buyerExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const buyerPartnerAmount = buyerHasPartner ? (Number(buyerPartnerShare) || 0) : 0;
  
  const buyerAgentNet = Math.max(0, buyerAgentGross - buyerPartnerAmount - buyerTotalExpenseAmount - buyerTaxDeduction);
  const buyerOfficeNet = Math.max(0, buyerBaseComm - buyerAgentGross);

  const totalGrossCollection = sellerTotalGross + buyerTotalGross;
  const totalAgentEarnings = sellerAgentNet + buyerAgentNet;
  const totalPartnerShares = sellerPartnerAmount + buyerPartnerAmount;
  const totalExpenses = sellerTotalExpenseAmount + buyerTotalExpenseAmount;
  const totalTaxAmount = sellerTaxAmount + buyerTaxAmount;
  const totalTaxDeductions = sellerTaxDeduction + buyerTaxDeduction;
  const grandTotalDeductions = totalAgentEarnings + totalPartnerShares + totalExpenses + totalTaxAmount + totalTaxDeductions;
  const totalOfficeNetIncome = sellerOfficeNet + buyerOfficeNet;

  const downloadPDFFromRef = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
    if (!targetRef.current) return;
    setIsPdfLoading(true);
    try {
      const element = targetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`360IC-Bordro-${Date.now()}.pdf`);
    } catch (err: any) {
      console.warn('Otomatik PDF hatası, yazdırma penceresine geçiliyor:', err);
      window.print();
    } finally {
      setIsPdfLoading(false);
    }
  };

  const saveTransaction = async () => {
    setIsSaving(true);
    try {
      const chosenTimestamp = new Date(transactionDate + 'T12:00:00Z').toISOString();

      const { data: trans, error: transError } = await supabase.from('transactions').insert({
        created_at: chosenTimestamp,
        transaction_type: transactionType,
        property_price: propertyPrice,
        tax_rate: taxRate,
        seller_name: sellerName || 'Belirtilmedi',
        seller_agent_id: sellerAgentId || null,
        seller_commission_type: sellerCommType,
        seller_commission_value: sellerCommValue,
        seller_base_commission: sellerBaseComm,
        seller_invoice_type: sellerInvoiceType,
        seller_invoice_amount: effectiveSellerInvoice,
        seller_tax_amount: sellerTaxAmount,
        seller_tax_deduction: sellerTaxDeduction,
        seller_total_gross_income: sellerTotalGross,
        seller_has_partnership: sellerHasPartner,
        seller_partner_name: sellerPartnerName,
        seller_partner_reason: sellerPartnerReason,
        seller_partner_share: sellerPartnerShare,
        seller_agent_rate_applied: sellerAgentRate,
        seller_agent_gross_earning: sellerAgentGross,
        seller_agent_total_expenses: sellerTotalExpenseAmount,
        seller_agent_net_earning: sellerAgentNet,
        seller_office_net_share: sellerOfficeNet,

        buyer_name: buyerName || 'Belirtilmedi',
        buyer_agent_id: buyerAgentId || null,
        buyer_commission_type: buyerCommType,
        buyer_commission_value: buyerCommValue,
        buyer_base_commission: buyerBaseComm,
        buyer_invoice_type: buyerInvoiceType,
        buyer_invoice_amount: effectiveBuyerInvoice,
        buyer_tax_amount: buyerTaxAmount,
        buyer_tax_deduction: buyerTaxDeduction,
        buyer_total_gross_income: buyerTotalGross,
        buyer_has_partnership: buyerHasPartner,
        buyer_partner_name: buyerPartnerName,
        buyer_partner_reason: buyerPartnerReason,
        buyer_partner_share: buyerPartnerShare,
        buyer_agent_rate_applied: buyerAgentRate,
        buyer_agent_gross_earning: buyerAgentGross,
        buyer_agent_total_expenses: buyerTotalExpenseAmount,
        buyer_agent_net_earning: buyerAgentNet,
        buyer_office_net_share: buyerOfficeNet,

        total_transaction_gross: totalGrossCollection,
        total_office_net_income: totalOfficeNetIncome
      }).select().single();

      if (transError) throw transError;

      const contactsToSync = [];
      if (sellerName && sellerName !== 'Belirtilmedi') contactsToSync.push({ full_name: sellerName, contact_type: 'MUSTERI' });
      if (buyerName && buyerName !== 'Belirtilmedi') contactsToSync.push({ full_name: buyerName, contact_type: 'MUSTERI' });
      if (sellerPartnerName) contactsToSync.push({ full_name: sellerPartnerName, contact_type: 'ORTAK' });
      if (buyerPartnerName) contactsToSync.push({ full_name: buyerPartnerName, contact_type: 'ORTAK' });

      for (const c of contactsToSync) {
        try {
          await supabase.from('contacts').insert(c);
        } catch {
          // Zaten varsa atla
        }
      }

      const expensesToInsert = [
        ...sellerExpenses.map(e => ({
          transaction_id: trans.id,
          side: 'SELLER',
          expense_type_id: e.expense_type_id !== 'custom' ? e.expense_type_id : null,
          custom_description: e.custom_description || 'Tanımsız Gider',
          amount: Number(e.amount) || 0
        })),
        ...buyerExpenses.map(e => ({
          transaction_id: trans.id,
          side: 'BUYER',
          expense_type_id: e.expense_type_id !== 'custom' ? e.expense_type_id : null,
          custom_description: e.custom_description || 'Tanımsız Gider',
          amount: Number(e.amount) || 0
        }))
      ];

      if (expensesToInsert.length > 0) {
        await supabase.from('transaction_expenses').insert(expensesToInsert);
      }

      setSavedSuccess(true);
      loadData();
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      alert('Kayıt hatası: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContactsList = contacts.filter(c => 
    c.full_name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(contactSearchQuery.toLowerCase()))
  );

  const activeFilteredAgentObj = agents.find(a => a.id === selectedAgentFilter);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 mb-2">
            <Building2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">360 IC Türkiye</h1>
            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mt-1">Yönetim & Hak Ediş Portalı</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">Sisteme devam etmek için lütfen erişim şifresini girin.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Erişim Şifresi"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-500 pr-10"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-4" />
              </div>
              {authError && (
                <p className="text-xs text-red-400 font-bold mt-2">{authError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 rounded-xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Güvenli Giriş Yap
            </button>
          </form>

          <p className="text-[11px] text-slate-600 font-medium">360 IC Gayrimenkul Yatırım & Danışmanlık A.Ş.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Üst Bar & Sekmeler */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-xl text-amber-500 shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">360 IC <span className="font-light text-slate-400">|</span> Investor Community</h1>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-0.5">Gayrimenkul Yönetim, Raporlama & Hak Ediş</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'calculator' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Calculator className="w-4 h-4" /> Hesapla
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'analytics' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <BarChart3 className="w-4 h-4" /> Raporlar & Analiz
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'contacts' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Contact2 className="w-4 h-4" /> Kişi Rehberi ({contacts.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'history' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <History className="w-4 h-4" /> Arşiv ({transactionsHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'settings' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Settings className="w-4 h-4" /> Tanımlar
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition font-bold text-xs flex items-center gap-1"
              title="Oturumu Kapat"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. SEKME: İŞLEM HESAPLAMA */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="flex justify-end gap-3">
              <button
                onClick={saveTransaction}
                disabled={isSaving}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition disabled:opacity-50 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving ? 'Sisteme İşleniyor...' : 'İşlemi Kaydet'}
              </button>
              <button
                onClick={() => downloadPDFFromRef(pdfRef)}
                disabled={isPdfLoading}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 px-6 py-2.5 rounded-xl font-bold shadow-md transition text-sm disabled:opacity-50 border border-slate-700"
              >
                {isPdfLoading ? <span className="animate-spin">⏳</span> : <Download className="w-4 h-4" />}
                {isPdfLoading ? 'PDF Hazırlanıyor...' : 'PDF İndir / Yazdır'}
              </button>
            </div>

            {savedSuccess && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-sm font-bold">İşlem başarıyla 360 IC veritabanına kaydedildi!</span>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    İşlem Tarihi
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">İşlem Türü</label>
                  <select 
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="SATIŞ">Satış İşlemi</option>
                    <option value="KİRALAMA">Kiralama İşlemi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {transactionType === 'SATIŞ' ? 'Gayrimenkul Satış Bedeli' : 'Aylık Kira Bedeli'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatInputDisplay(propertyPrice)}
                      placeholder="0"
                      onChange={(e) => setPropertyPrice(parseInputValue(e.target.value))}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-black text-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none pr-12"
                    />
                    <span className="absolute right-4 top-3.5 text-amber-600 font-bold text-sm">TL</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">KDV Oranı (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={taxRate || ''}
                      placeholder="20"
                      onChange={(e) => setTaxRate(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none pr-10"
                    />
                    <span className="absolute right-4 top-3.5 text-amber-600 font-bold text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolonlar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SATICI TARAFI */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    Satıcı Tarafı (Portföy)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-600">Müşteri Adı</label>
                      <button 
                        type="button" 
                        onClick={() => { setSellerInputMode(sellerInputMode === 'select' ? 'new' : 'select'); setSellerName(''); }}
                        className="text-[11px] text-amber-600 hover:text-amber-800 font-bold"
                      >
                        {sellerInputMode === 'select' ? '+ Yeni Ekle' : 'Rehberden Seç'}
                      </button>
                    </div>
                    {sellerInputMode === 'select' ? (
                      <select
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">Kayıtlı Müşteri Seçin</option>
                        {contacts.filter(c => c.contact_type === 'MUSTERI').map(c => (
                          <option key={c.id} value={c.full_name}>{c.full_name} {c.company ? `(${c.company})` : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ad Soyad"
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Danışman</label>
                    <select
                      value={sellerAgentId}
                      onChange={(e) => setSellerAgentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">Danışman Seçin</option>
                      {activeAgents.map(a => (
                        <option key={a.id} value={a.id}>[{a.code}] {a.full_name} (%{a.commission_rate})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Komisyon */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Hizmet Bedeli / Komisyon</span>
                    <div className="flex gap-1 text-xs p-1 bg-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSellerCommType('percentage')}
                        className={`px-3 py-1 rounded-md font-bold transition ${sellerCommType === 'percentage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        Yüzde (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellerCommType('fixed')}
                        className={`px-3 py-1 rounded-md font-bold transition ${sellerCommType === 'fixed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        Sabit (TL)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      <input
                        type="text"
                        value={sellerCommType === 'percentage' ? (sellerCommValue || '') : formatInputDisplay(sellerCommValue)}
                        placeholder={sellerCommType === 'percentage' ? 'Örn: 2' : '0'}
                        onChange={(e) => setSellerCommValue(sellerCommType === 'percentage' ? (e.target.value === '' ? 0 : Number(e.target.value)) : parseInputValue(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 text-sm font-bold pr-8 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">
                        {sellerCommType === 'percentage' ? '%' : 'TL'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-bold uppercase">Komisyon Matrahı</div>
                      <div className="font-black text-slate-900 text-base">{formatMoney(sellerBaseComm)}</div>
                    </div>
                  </div>
                </div>

                {/* Fatura */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">Fatura Durumu</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSellerInvoiceType('unbilled')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${sellerInvoiceType === 'unbilled' ? 'bg-slate-900 text-amber-500 shadow-sm border-slate-900' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Faturasız
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellerInvoiceType('full')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${sellerInvoiceType === 'full' ? 'bg-amber-600 text-white shadow-sm border-amber-600' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Tam Fatura
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellerInvoiceType('partial')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${sellerInvoiceType === 'partial' ? 'bg-amber-500 text-white shadow-sm border-amber-500' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Kısmi Fatura
                    </button>
                  </div>

                  {sellerInvoiceType === 'partial' && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Faturalandırılacak Tutar</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formatInputDisplay(sellerInvoiceAmount)}
                          placeholder="0"
                          onChange={(e) => setSellerInvoiceAmount(parseInputValue(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-sm font-bold pr-10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">TL</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-500">KDV Tutarı: <b className="text-slate-900">{formatMoney(sellerTaxAmount)}</b></span>
                    <span className="text-slate-500">Kasa Tahsilat: <b className="text-amber-600">{formatMoney(sellerTotalGross)}</b></span>
                  </div>
                </div>

                {/* Ortak Çalışma */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sellerHasPartner}
                      onChange={(e) => setSellerHasPartner(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Ortak Çalışma Payı Düş</span>
                  </label>

                  {sellerHasPartner && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Ortak Adı</span>
                          <button 
                            type="button" 
                            onClick={() => { setSellerPartnerMode(sellerPartnerMode === 'select' ? 'new' : 'select'); setSellerPartnerName(''); }}
                            className="text-[10px] text-amber-600 hover:text-amber-800 font-bold"
                          >
                            {sellerPartnerMode === 'select' ? '+ Yeni' : 'Seç'}
                          </button>
                        </div>
                        {sellerPartnerMode === 'select' ? (
                          <select
                            value={sellerPartnerName}
                            onChange={(e) => setSellerPartnerName(e.target.value)}
                            className="p-2 rounded-lg border border-slate-300 text-xs bg-white w-full font-bold"
                          >
                            <option value="">Seçiniz</option>
                            {contacts.filter(c => c.contact_type === 'ORTAK').map(c => (
                              <option key={c.id} value={c.full_name}>{c.full_name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Ad Soyad"
                            value={sellerPartnerName}
                            onChange={(e) => setSellerPartnerName(e.target.value)}
                            className="p-2 rounded-lg border border-slate-300 text-xs w-full font-bold"
                          />
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Neden</span>
                        <input
                          type="text"
                          placeholder="Açıklama"
                          value={sellerPartnerReason}
                          onChange={(e) => setSellerPartnerReason(e.target.value)}
                          className="p-2 rounded-lg border border-slate-300 text-xs w-full font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Pay Tutarı</span>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="0"
                            value={formatInputDisplay(sellerPartnerShare)}
                            onChange={(e) => setSellerPartnerShare(parseInputValue(e.target.value))}
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold pr-7"
                          />
                          <span className="absolute right-2 top-2 text-slate-400 text-[10px] font-bold">TL</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Giderler */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Temsilci Giderleri</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addExpense('seller')}
                      className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-black text-amber-500 px-3 py-1.5 rounded-lg font-bold shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Gider Ekle
                    </button>
                  </div>

                  <div className="space-y-2">
                    {sellerExpenses.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                        <select
                          value={item.expense_type_id}
                          onChange={(e) => handleExpenseTypeChange('seller', item.id, e.target.value)}
                          className="p-1.5 border border-slate-300 rounded text-xs w-full sm:w-2/5 bg-slate-50 font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="custom">✏️ Tanımsız / Özel Gider</option>
                          <optgroup label="Tanımlı Masraf Kalemleri">
                            {expenseTypes.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({formatMoney(t.default_cost)})</option>
                            ))}
                          </optgroup>
                        </select>

                        <input
                          type="text"
                          placeholder={item.expense_type_id === 'custom' ? 'Özel Gider Açıklaması' : 'Açıklama'}
                          value={item.custom_description}
                          onChange={(e) => updateExpenseField('seller', item.id, 'custom_description', e.target.value)}
                          className="p-1.5 border border-slate-300 rounded text-xs flex-1 w-full font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />

                        <div className="relative w-full sm:w-28">
                          <input
                            type="text"
                            placeholder="0"
                            value={formatInputDisplay(item.amount)}
                            onChange={(e) => updateExpenseField('seller', item.id, 'amount', parseInputValue(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold pr-7 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="absolute right-2 top-1.5 text-slate-400 text-[10px] font-bold">TL</span>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => removeExpense('seller', item.id)}
                          className="text-red-500 hover:text-red-700 p-1 shrink-0 bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hak Ediş Özeti & Vergi Kesintisi */}
                <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Brüt Danışman Payı (%{sellerAgentRate}):</span>
                    <b className="text-slate-900">{formatMoney(sellerAgentGross)}</b>
                  </div>
                  {sellerTaxDeduction > 0 && (
                    <div className="flex justify-between text-amber-900 font-bold bg-amber-100/70 p-1.5 rounded-lg">
                      <span>Fatura Gelir Vergisi Kesintisi (%25 Matrah Payı):</span>
                      <b>- {formatMoney(sellerTaxDeduction)}</b>
                    </div>
                  )}
                  {sellerHasPartner && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Ortak Kesintisi:</span>
                      <b>- {formatMoney(sellerPartnerAmount)}</b>
                    </div>
                  )}
                  {sellerTotalExpenseAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Gider Kesintisi:</span>
                      <b>- {formatMoney(sellerTotalExpenseAmount)}</b>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-amber-200">
                    <span>Temsilci NET Hak Ediş:</span>
                    <span className="text-amber-700">{formatMoney(sellerAgentNet)}</span>
                  </div>
                </div>
              </div>

              {/* ALICI TARAFI */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    Alıcı Tarafı (Müşteri)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-600">Müşteri Adı</label>
                      <button 
                        type="button" 
                        onClick={() => { setBuyerInputMode(buyerInputMode === 'select' ? 'new' : 'select'); setBuyerName(''); }}
                        className="text-[11px] text-emerald-600 hover:text-emerald-800 font-bold"
                      >
                        {buyerInputMode === 'select' ? '+ Yeni Ekle' : 'Rehberden Seç'}
                      </button>
                    </div>
                    {buyerInputMode === 'select' ? (
                      <select
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">Kayıtlı Müşteri Seçin</option>
                        {contacts.filter(c => c.contact_type === 'MUSTERI').map(c => (
                          <option key={c.id} value={c.full_name}>{c.full_name} {c.company ? `(${c.company})` : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ad Soyad"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Danışman</label>
                    <select
                      value={buyerAgentId}
                      onChange={(e) => setBuyerAgentId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">Danışman Seçin</option>
                      {activeAgents.map(a => (
                        <option key={a.id} value={a.id}>[{a.code}] {a.full_name} (%{a.commission_rate})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Komisyon */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Hizmet Bedeli / Komisyon</span>
                    <div className="flex gap-1 text-xs p-1 bg-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setBuyerCommType('percentage')}
                        className={`px-3 py-1 rounded-md font-bold transition ${buyerCommType === 'percentage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        Yüzde (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuyerCommType('fixed')}
                        className={`px-3 py-1 rounded-md font-bold transition ${buyerCommType === 'fixed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        Sabit (TL)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      <input
                        type="text"
                        value={buyerCommType === 'percentage' ? (buyerCommValue || '') : formatInputDisplay(buyerCommValue)}
                        placeholder={buyerCommType === 'percentage' ? 'Örn: 2' : '0'}
                        onChange={(e) => setBuyerCommValue(buyerCommType === 'percentage' ? (e.target.value === '' ? 0 : Number(e.target.value)) : parseInputValue(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 text-sm font-bold pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">
                        {buyerCommType === 'percentage' ? '%' : 'TL'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-bold uppercase">Komisyon Matrahı</div>
                      <div className="font-black text-slate-900 text-base">{formatMoney(buyerBaseComm)}</div>
                    </div>
                  </div>
                </div>

                {/* Fatura */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">Fatura Durumu</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBuyerInvoiceType('unbilled')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${buyerInvoiceType === 'unbilled' ? 'bg-slate-900 text-amber-500 shadow-sm border-slate-900' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Faturasız
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyerInvoiceType('full')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${buyerInvoiceType === 'full' ? 'bg-emerald-600 text-white shadow-sm border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Tam Fatura
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyerInvoiceType('partial')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${buyerInvoiceType === 'partial' ? 'bg-emerald-500 text-white shadow-sm border-emerald-500' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Kısmi Fatura
                    </button>
                  </div>

                  {buyerInvoiceType === 'partial' && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Faturalandırılacak Tutar</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formatInputDisplay(buyerInvoiceAmount)}
                          placeholder="0"
                          onChange={(e) => setBuyerInvoiceAmount(parseInputValue(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-sm font-bold pr-10 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">TL</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-500">KDV Tutarı: <b className="text-slate-900">{formatMoney(buyerTaxAmount)}</b></span>
                    <span className="text-slate-500">Kasa Tahsilat: <b className="text-emerald-600">{formatMoney(buyerTotalGross)}</b></span>
                  </div>
                </div>

                {/* Ortak Çalışma */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={buyerHasPartner}
                      onChange={(e) => setBuyerHasPartner(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Ortak Çalışma Payı Düş</span>
                  </label>

                  {buyerHasPartner && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Ortak Adı</span>
                          <button 
                            type="button" 
                            onClick={() => { setBuyerPartnerMode(buyerPartnerMode === 'select' ? 'new' : 'select'); setBuyerPartnerName(''); }}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold"
                          >
                            {buyerPartnerMode === 'select' ? '+ Yeni' : 'Seç'}
                          </button>
                        </div>
                        {buyerPartnerMode === 'select' ? (
                          <select
                            value={buyerPartnerName}
                            onChange={(e) => setBuyerPartnerName(e.target.value)}
                            className="p-2 rounded-lg border border-slate-300 text-xs bg-white w-full font-bold"
                          >
                            <option value="">Seçiniz</option>
                            {contacts.filter(c => c.contact_type === 'ORTAK').map(c => (
                              <option key={c.id} value={c.full_name}>{c.full_name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Ad Soyad"
                            value={buyerPartnerName}
                            onChange={(e) => setBuyerPartnerName(e.target.value)}
                            className="p-2 rounded-lg border border-slate-300 text-xs w-full font-bold"
                          />
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Neden</span>
                        <input
                          type="text"
                          placeholder="Açıklama"
                          value={buyerPartnerReason}
                          onChange={(e) => setBuyerPartnerReason(e.target.value)}
                          className="p-2 rounded-lg border border-slate-300 text-xs w-full font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Pay Tutarı</span>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="0"
                            value={formatInputDisplay(buyerPartnerShare)}
                            onChange={(e) => setBuyerPartnerShare(parseInputValue(e.target.value))}
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold pr-7"
                          />
                          <span className="absolute right-2 top-2 text-slate-400 text-[10px] font-bold">TL</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Giderler */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Temsilci Giderleri</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addExpense('buyer')}
                      className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-black text-amber-500 px-3 py-1.5 rounded-lg font-bold shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Gider Ekle
                    </button>
                  </div>

                  <div className="space-y-2">
                    {buyerExpenses.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                        <select
                          value={item.expense_type_id}
                          onChange={(e) => handleExpenseTypeChange('buyer', item.id, e.target.value)}
                          className="p-1.5 border border-slate-300 rounded text-xs w-full sm:w-2/5 bg-slate-50 font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="custom">✏️ Tanımsız / Özel Gider</option>
                          <optgroup label="Tanımlı Masraf Kalemleri">
                            {expenseTypes.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({formatMoney(t.default_cost)})</option>
                            ))}
                          </optgroup>
                        </select>

                        <input
                          type="text"
                          placeholder={item.expense_type_id === 'custom' ? 'Özel Gider Açıklaması' : 'Açıklama'}
                          value={item.custom_description}
                          onChange={(e) => updateExpenseField('buyer', item.id, 'custom_description', e.target.value)}
                          className="p-1.5 border border-slate-300 rounded text-xs flex-1 w-full font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />

                        <div className="relative w-full sm:w-28">
                          <input
                            type="text"
                            placeholder="0"
                            value={formatInputDisplay(item.amount)}
                            onChange={(e) => updateExpenseField('buyer', item.id, 'amount', parseInputValue(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold pr-7 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="absolute right-2 top-1.5 text-slate-400 text-[10px] font-bold">TL</span>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => removeExpense('buyer', item.id)}
                          className="text-red-500 hover:text-red-700 p-1 shrink-0 bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hak Ediş Özeti & Vergi Kesintisi */}
                <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Brüt Danışman Payı (%{buyerAgentRate}):</span>
                    <b className="text-slate-900">{formatMoney(buyerAgentGross)}</b>
                  </div>
                  {buyerTaxDeduction > 0 && (
                    <div className="flex justify-between text-emerald-900 font-bold bg-emerald-100/70 p-1.5 rounded-lg">
                      <span>Fatura Gelir Vergisi Kesintisi (%25 Matrah Payı):</span>
                      <b>- {formatMoney(buyerTaxDeduction)}</b>
                    </div>
                  )}
                  {buyerHasPartner && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Ortak Kesintisi:</span>
                      <b>- {formatMoney(buyerPartnerAmount)}</b>
                    </div>
                  )}
                  {buyerTotalExpenseAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Gider Kesintisi:</span>
                      <b>- {formatMoney(buyerTotalExpenseAmount)}</b>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-emerald-200">
                    <span>Temsilci NET Hak Ediş:</span>
                    <span className="text-emerald-700">{formatMoney(buyerAgentNet)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GELİR - GİDER - NET TABLOSU & PDF BORDROSU */}
            <div ref={pdfRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-slate-900 pb-4 gap-2">
                <div>
                  <span className="text-xs font-black tracking-widest text-amber-600 uppercase">360 IC - Investor Community</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">İŞLEM VE HAK EDİŞ BORDROSU</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1">İşlem Tarihi: {new Date(transactionDate).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="sm:text-right bg-slate-900 p-4 rounded-xl shadow-md">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">{transactionType} İŞLEM BEDELİ</span>
                  <p className="text-2xl font-black text-white mt-1">{formatMoney(propertyPrice)}</p>
                </div>
              </div>

              {/* Taraf Dökümleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-2 mb-2 flex justify-between">
                    <span className="text-amber-600">Satıcı Portföy Tarafı</span>
                    <span className="font-bold text-slate-500">Temsilci: {selectedSellerAgent ? `[${selectedSellerAgent.code}] ${selectedSellerAgent.full_name}` : 'Atanmadı'}</span>
                  </div>
                  <div className="flex justify-between"><span>Müşteri:</span><b className="text-slate-800">{sellerName || '-'}</b></div>
                  <div className="flex justify-between"><span>Komisyon Matrahı:</span><b className="text-slate-800">{formatMoney(sellerBaseComm)}</b></div>
                  <div className="flex justify-between"><span>Fatura KDV:</span><b className="text-slate-800">{formatMoney(sellerTaxAmount)}</b></div>
                  {sellerTaxDeduction > 0 && (
                    <div className="flex justify-between text-amber-900 font-bold"><span>Gelir Vergisi Kesintisi (%25):</span><b>- {formatMoney(sellerTaxDeduction)}</b></div>
                  )}
                  {sellerExpenses.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-slate-200 text-slate-600">
                      <span className="font-bold block mb-1">Düşülen Masraflar:</span>
                      {sellerExpenses.map((e, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] pl-2 text-slate-500 font-medium">
                          <span>• {e.custom_description || 'Gider'}:</span>
                          <span>- {formatMoney(Number(e.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-amber-700 font-black pt-2 mt-1 border-t border-slate-200 text-sm">
                    <span>Temsilci Net Hak Ediş:</span>
                    <span>{formatMoney(sellerAgentNet)}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-2 mb-2 flex justify-between">
                    <span className="text-emerald-600">Alıcı Müşteri Tarafı</span>
                    <span className="font-bold text-slate-500">Temsilci: {selectedBuyerAgent ? `[${selectedBuyerAgent.code}] ${selectedBuyerAgent.full_name}` : 'Atanmadı'}</span>
                  </div>
                  <div className="flex justify-between"><span>Müşteri:</span><b className="text-slate-800">{buyerName || '-'}</b></div>
                  <div className="flex justify-between"><span>Komisyon Matrahı:</span><b className="text-slate-800">{formatMoney(buyerBaseComm)}</b></div>
                  <div className="flex justify-between"><span>Fatura KDV:</span><b className="text-slate-800">{formatMoney(buyerTaxAmount)}</b></div>
                  {buyerTaxDeduction > 0 && (
                    <div className="flex justify-between text-emerald-900 font-bold"><span>Gelir Vergisi Kesintisi (%25):</span><b>- {formatMoney(buyerTaxDeduction)}</b></div>
                  )}
                  {buyerExpenses.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-slate-200 text-slate-600">
                      <span className="font-bold block mb-1">Düşülen Masraflar:</span>
                      {buyerExpenses.map((e, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] pl-2 text-slate-500 font-medium">
                          <span>• {e.custom_description || 'Gider'}:</span>
                          <span>- {formatMoney(Number(e.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-700 font-black pt-2 mt-1 border-t border-slate-200 text-sm">
                    <span>Temsilci Net Hak Ediş:</span>
                    <span>{formatMoney(buyerAgentNet)}</span>
                  </div>
                </div>
              </div>

              {/* Genel Mali Tablo */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-amber-500 p-3 font-black text-xs uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Mali Hesap Özeti & Net Kasa Dağılımı
                </div>

                <div className="p-5 space-y-5 bg-white">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wider mb-2">
                      <TrendingUp className="w-4 h-4" />
                      Brüt Kasa Girişi (Tahsil Edilen)
                    </div>
                    <div className="bg-emerald-50/50 rounded-lg p-3 space-y-1.5 text-xs border border-emerald-100 font-bold">
                      <div className="flex justify-between text-slate-700">
                        <span>Satıcı Komisyon + KDV:</span>
                        <span>{formatMoney(sellerTotalGross)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Alıcı Komisyon + KDV:</span>
                        <span>{formatMoney(buyerTotalGross)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-black pt-1.5 border-t border-emerald-200 text-sm">
                        <span>TOPLAM BRÜT KASA GELİRİ:</span>
                        <span className="text-emerald-700">{formatMoney(totalGrossCollection)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-red-700 font-black text-xs uppercase tracking-wider mb-2">
                      <TrendingDown className="w-4 h-4" />
                      Kasa Çıkışları (Hak Ediş, Gider ve Vergi)
                    </div>
                    <div className="bg-red-50/50 rounded-lg p-3 space-y-1.5 text-xs border border-red-100 font-bold">
                      <div className="flex justify-between text-slate-700">
                        <span>Temsilci Net Hak Edişleri Toplamı:</span>
                        <span className="text-red-600">- {formatMoney(totalAgentEarnings)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Fatura Gelir Vergisi Kesintileri (%25 Stopaj):</span>
                        <span className="text-red-600">- {formatMoney(totalTaxDeductions)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Ortak Çalışma Payları:</span>
                        <span className="text-red-600">- {formatMoney(totalPartnerShares)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Operasyonel Masraflar:</span>
                        <span className="text-red-600">- {formatMoney(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Devlete Aktarılacak KDV Tutarı:</span>
                        <span className="text-red-600">- {formatMoney(totalTaxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-black pt-1.5 border-t border-red-200 text-sm">
                        <span>TOPLAM KASA ÇIKIŞI:</span>
                        <span className="text-red-700">- {formatMoney(grandTotalDeductions)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-5 flex justify-between items-center shadow-lg border border-slate-700">
                    <div>
                      <span className="text-xs text-amber-500 font-black uppercase tracking-wider block">360 IC - ŞİRKET NET KAZANCI</span>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tüm hak ediş ve kesintiler düşüldükten sonra kalan ofis payı</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{formatMoney(totalOfficeNetIncome)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SEKME: RAPORLAR, GRAFİKLER & TEMSİLCİ PERFORMANSI */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-amber-500 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Temsilci / Danışman Filtresi</label>
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    className="p-1.5 pl-0 bg-transparent font-black text-sm text-slate-900 border-b border-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">🌟 TÜM OFİS & DANIŞMANLAR</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>👤 [{a.code}] {a.full_name} {a.is_active === false ? '(Pasif)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${dateFilter === 'all' ? 'bg-slate-900 text-amber-500 border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-300'}`}
                >
                  Tüm Zamanlar
                </button>
                <button
                  onClick={() => setDateFilter('this_month')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${dateFilter === 'this_month' ? 'bg-slate-900 text-amber-500 border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-300'}`}
                >
                  Bu Ay
                </button>
                <button
                  onClick={() => setDateFilter('this_year')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${dateFilter === 'this_year' ? 'bg-slate-900 text-amber-500 border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-300'}`}
                >
                  Bu Yıl
                </button>
                <button
                  onClick={() => setDateFilter('custom')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${dateFilter === 'custom' ? 'bg-slate-900 text-amber-500 border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-300'}`}
                >
                  Özel Aralık
                </button>

                {dateFilter === 'custom' && (
                  <div className="flex items-center gap-1.5 pl-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="p-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                    <span className="text-xs text-slate-400">-</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="p-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* KPI Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {selectedAgentFilter === 'all' ? 'Toplam İşlem Sayısı' : 'Temsilci İşlem Sayısı'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">{analyticsSummary.totalTransactions}</span>
                  <span className="text-xs font-bold text-slate-500">Adet</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-600 mt-2 flex gap-3">
                  <span>🏢 Satış: <b>{analyticsSummary.totalSalesCount}</b></span>
                  <span>🔑 Kira: <b>{analyticsSummary.totalRentCount}</b></span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {selectedAgentFilter === 'all' ? 'Toplam Brüt Gelir (Kasa)' : 'Temsilci Brüt Hacmi'}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">{formatMoney(analyticsSummary.totalGrossVolume)}</div>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">Tahsil edilen komisyon + vergi</span>
              </div>

              {selectedAgentFilter !== 'all' ? (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-600">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Temsilci Net Hak Edişi</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">{formatMoney(analyticsSummary.totalAgentNetEarnings)}</div>
                  <span className="text-[11px] text-slate-400 font-medium mt-1 block">Vergi, gider ve ortaklıklar sonrası</span>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kayıtlı Portföy / Rehber</span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{contacts.length}</div>
                  <span className="text-[11px] text-slate-400 font-medium mt-1 block">Müşteri ve Harici Ortaklar</span>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {selectedAgentFilter === 'all' ? '360 IC Şirket Net Kârı' : 'Ofise Bıraktığı Net Kâr'}
                </span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{formatMoney(analyticsSummary.totalOfficeNet)}</div>
                <span className="text-[11px] text-emerald-700/80 font-bold mt-1 block">Şirket kasasında kalan pay</span>
              </div>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-600" />
                    {selectedAgentFilter === 'all' ? 'Ofis Ciro & Kârlılık Zaman Akışı' : `[${activeFilteredAgentObj?.code}] ${activeFilteredAgentObj?.full_name} Performans Akışı`}
                  </h3>

                  <div className="flex bg-slate-100 p-1 rounded-lg gap-1 self-start">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition ${chartType === 'bar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      title="Çubuk Grafik"
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Çubuk
                    </button>
                    <button
                      onClick={() => setChartType('area')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition ${chartType === 'area' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      title="Alan Grafik"
                    >
                      <Activity className="w-3.5 h-3.5" /> Alan
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition ${chartType === 'line' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      title="Çizgi Grafik"
                    >
                      <LineChartIcon className="w-3.5 h-3.5" /> Çizgi
                    </button>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  {analyticsSummary.chartTimelineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={analyticsSummary.chartTimelineData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="dateLabel" fontSize={11} stroke="#94a3b8" />
                          <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                          <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                          <Bar dataKey="gross" name="Brüt Hacim" fill="#d97706" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="net" name="Şirket Net Payı" fill="#10b981" radius={[4, 4, 0, 0]} />
                          {selectedAgentFilter !== 'all' && (
                            <Bar dataKey="agentEarn" name="Temsilci Net Hak Ediş" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          )}
                        </BarChart>
                      ) : chartType === 'area' ? (
                        <AreaChart data={analyticsSummary.chartTimelineData}>
                          <defs>
                            <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="dateLabel" fontSize={11} stroke="#94a3b8" />
                          <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                          <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                          <Area type="monotone" dataKey="gross" name="Brüt Hacim" stroke="#d97706" fillOpacity={1} fill="url(#grossGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="net" name="Şirket Net Payı" stroke="#10b981" fillOpacity={1} fill="url(#netGrad)" strokeWidth={2} />
                        </AreaChart>
                      ) : (
                        <LineChart data={analyticsSummary.chartTimelineData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="dateLabel" fontSize={11} stroke="#94a3b8" />
                          <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                          <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                          <Line type="monotone" dataKey="gross" name="Brüt Hacim" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="net" name="Şirket Net Payı" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                          {selectedAgentFilter !== 'all' && (
                            <Line type="monotone" dataKey="agentEarn" name="Temsilci Net Hak Ediş" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                          )}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">Veri bulunmuyor.</div>
                  )}
                </div>
              </div>

              {/* Satış vs Kiralama Dağılımı */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    İşlem Türü Dağılımı
                  </h3>
                </div>
                <div className="h-56 w-full flex items-center justify-center">
                  {analyticsSummary.totalTransactions > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsSummary.pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (%${((percent ?? 0) * 100).toFixed(0)})`}
                          fontSize={10}
                        >
                          {analyticsSummary.pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-400">İşlem yok.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Danışman & Müşteri Sıralamaları */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Danışman Performans Sıralaması (İşlem Adedi & Net Hak Ediş)
                  </h3>
                </div>

                <div className="space-y-2">
                  {analyticsSummary.topAgentsByCount.map((ag, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedAgentFilter(ag.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${selectedAgentFilter === ag.id ? 'bg-amber-50/80 border-amber-400 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500 text-slate-950' : i === 1 ? 'bg-slate-300 text-slate-800' : 'bg-slate-200 text-slate-600'}`}>
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{ag.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">Temsilci Net: {formatMoney(ag.agentNet)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-slate-900 text-amber-400 rounded-md font-black mr-2 text-xs">{ag.count} İşlem</span>
                        <span className="font-bold text-emerald-600 block sm:inline mt-1 sm:mt-0 text-xs">+{formatMoney(ag.officeNet)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    En Yüksek Hacimli Müşteri & Ortaklar
                  </h3>
                </div>

                <div className="space-y-2">
                  {analyticsSummary.topContactsByVolume.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{c.role}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">{formatMoney(c.totalGross)}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{c.count} İşlemde Yer Aldı</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 3. SEKME: KİŞİ REHBERİ (CRM) */}
        {activeTab === 'contacts' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Contact2 className="w-5 h-5 text-amber-600" />
                  360 IC Müşteri, Danışan & Ortak Rehberi
                </h2>
                <p className="text-xs text-slate-500 font-medium">İşlem yaptığınız tüm kişilerin iletişim detaylarını buradan yönetebilirsiniz.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kişi veya firma ara..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="p-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none w-56"
                />
                <button
                  onClick={() => setEditingContact({ id: '', full_name: '', contact_type: 'MUSTERI', phone: '', email: '', company: '', notes: '' })}
                  className="bg-slate-900 hover:bg-black text-amber-400 px-3 py-2 rounded-xl text-xs font-bold shadow transition"
                >
                  + Yeni Kişi Ekle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContactsList.map(c => (
                <div key={c.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative group hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{c.full_name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${c.contact_type === 'MUSTERI' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {c.contact_type === 'MUSTERI' ? 'Müşteri / Danışan' : 'Ortak Çalışma'}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingContact(c)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 bg-white rounded-lg border border-slate-200 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    {c.company && <div className="font-semibold text-slate-800">🏢 {c.company}</div>}
                    {c.phone ? (
                      <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {c.phone}</div>
                    ) : (
                      <div className="text-slate-400 italic text-[11px]">Telefon eklenmedi</div>
                    )}
                    {c.email ? (
                      <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {c.email}</div>
                    ) : (
                      <div className="text-slate-400 italic text-[11px]">E-posta eklenmedi</div>
                    )}
                  </div>

                  {c.notes && (
                    <div className="p-2 bg-white rounded-lg text-[11px] text-slate-500 border border-slate-200/60">
                      <b>Not:</b> {c.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SEKME: İŞLEM ARŞİVİ */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-600" />
                  İşlem Arşivi ({transactionsHistory.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">Detayları görmek, bordroyu yazdırmak veya hatalı/deneme işlemlerini silmek için listeyi kullanın.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-amber-500 font-black border-b border-slate-700">
                    <th className="p-4 rounded-tl-lg">Tarih</th>
                    <th className="p-4">Tür</th>
                    <th className="p-4">Satıcı</th>
                    <th className="p-4">Alıcı</th>
                    <th className="p-4">İşlem Bedeli</th>
                    <th className="p-4 text-white">Brüt Gelir</th>
                    <th className="p-4 text-emerald-400">360 IC Şirket Payı</th>
                    <th className="p-4 text-right rounded-tr-lg">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-slate-50">
                  {transactionsHistory.map(row => (
                    <tr 
                      key={row.id} 
                      onClick={() => openHistoryDetail(row)}
                      className="hover:bg-amber-50/60 cursor-pointer transition border-b border-slate-200"
                    >
                      <td className="p-4 text-slate-600 font-bold">{new Date(row.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="p-4"><span className="px-2.5 py-1 bg-slate-200 text-slate-900 font-black rounded-md">{row.transaction_type}</span></td>
                      <td className="p-4 font-bold text-slate-900">{row.seller_name}</td>
                      <td className="p-4 font-bold text-slate-900">{row.buyer_name}</td>
                      <td className="p-4 font-black text-slate-700">{formatMoney(Number(row.property_price))}</td>
                      <td className="p-4 font-black text-slate-900">{formatMoney(Number(row.total_transaction_gross))}</td>
                      <td className="p-4 font-black text-emerald-600 text-sm">{formatMoney(Number(row.total_office_net_income))}</td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openHistoryDetail(row); }}
                          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-black text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> İncele
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(row.id); }}
                          className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                          title="İşlemi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. SEKME: SİSTEM TANIMLARI */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Temsilci Kadrosu */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base font-black text-slate-900">Temsilci Kadrosu Yönetimi</h2>
                </div>
                <span className="text-xs font-bold text-slate-500">{agents.length} Kayıtlı Danışman</span>
              </div>

              {/* Yeni Temsilci Ekle */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Yeni Temsilci Tanımla</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Kod (363)"
                    value={newAgentCode}
                    onChange={(e) => setNewAgentCode(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Oran (%50)"
                    value={newAgentRate || ''}
                    onChange={(e) => setNewAgentRate(Number(e.target.value))}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <button
                  onClick={handleAddAgent}
                  className="w-full bg-slate-900 hover:bg-black text-amber-500 py-2.5 rounded-lg text-xs font-black transition shadow-md"
                >
                  + Temsilciyi Kaydet
                </button>
              </div>

              {/* Temsilci Listesi */}
              <div className="space-y-2">
                {agents.map(a => {
                  const isActive = a.is_active !== false;
                  return (
                    <div key={a.id} className={`flex justify-between items-center p-3 rounded-xl border text-xs transition ${isActive ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-600">[{a.code}]</span>
                          <span className="font-bold text-slate-900">{a.full_name}</span>
                          {!isActive && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded">PASİF</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Hak Ediş Payı: %{a.commission_rate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAgentActiveStatus(a)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                          title={isActive ? 'Danışmanı Pasife Al' : 'Danışmanı Aktifleştir'}
                        >
                          {isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                          {isActive ? 'Aktif' : 'Pasif'}
                        </button>

                        <button 
                          onClick={() => setEditingAgent(a)} 
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-white rounded-lg border border-slate-200 shadow-sm"
                          title="Danışmanı Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => handleDeleteAgent(a.id)} 
                          className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 rounded-lg"
                          title="Tamamen Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standart Gider Kalemleri */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-slate-900" />
                  <h2 className="text-base font-black text-slate-900">Standart Gider Kalemleri</h2>
                </div>
                <span className="text-xs font-bold text-slate-500">{expenseTypes.length} Tanımlı Masraf</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Yeni Gider Kalemi Tanımla</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Gider Adı (Drone vb.)"
                    value={newExpName}
                    onChange={(e) => setNewExpName(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Varsayılan Tutar"
                      value={formatInputDisplay(newExpCost)}
                      onChange={(e) => setNewExpCost(parseInputValue(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-black pr-7"
                    />
                    <span className="absolute right-2 top-2 text-slate-400 text-[10px] font-bold">TL</span>
                  </div>
                </div>
                <button
                  onClick={handleAddExpenseType}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg text-xs font-black transition shadow-md"
                >
                  + Kalemi Kaydet
                </button>
              </div>

              <div className="space-y-2">
                {expenseTypes.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded font-black">{formatMoney(t.default_cost)}</span>
                      <button 
                        onClick={() => setEditingExpenseType(t)} 
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-white rounded-lg border border-slate-200 shadow-sm"
                        title="Gideri Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteExpenseType(t.id)} 
                        className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"
                        title="Gideri Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEMSİLCİ DÜZENLEME MODALI */}
        {editingAgent && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-black text-slate-900">Temsilci Bilgilerini Güncelle</h3>
                <button onClick={() => setEditingAgent(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temsilci Kodu</label>
                  <input
                    type="text"
                    value={editingAgent.code}
                    onChange={(e) => setEditingAgent({ ...editingAgent, code: e.target.value })}
                    className="w-full p-2.5 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    value={editingAgent.full_name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, full_name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hak Ediş Komisyon Oranı (%)</label>
                  <input
                    type="number"
                    value={editingAgent.commission_rate}
                    onChange={(e) => setEditingAgent({ ...editingAgent, commission_rate: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Çalışma Durumu</label>
                  <select
                    value={editingAgent.is_active !== false ? 'active' : 'inactive'}
                    onChange={(e) => setEditingAgent({ ...editingAgent, is_active: e.target.value === 'active' })}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="active">✅ Aktif (Yeni işlemlerde seçilebilir)</option>
                    <option value="inactive">❌ Pasif (İşten ayrıldı / Yeni işlemlerde gizle)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => setEditingAgent(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateAgent}
                  className="w-1/2 bg-slate-900 hover:bg-black text-amber-400 py-2.5 rounded-xl text-xs font-black shadow"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GİDER TÜRÜ DÜZENLEME MODALI */}
        {editingExpenseType && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-black text-slate-900">Gider Kalemini Güncelle</h3>
                <button onClick={() => setEditingExpenseType(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gider Adı</label>
                  <input
                    type="text"
                    value={editingExpenseType.name}
                    onChange={(e) => setEditingExpenseType({ ...editingExpenseType, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Varsayılan Tutar (TL)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatInputDisplay(editingExpenseType.default_cost)}
                      onChange={(e) => setEditingExpenseType({ ...editingExpenseType, default_cost: parseInputValue(e.target.value) })}
                      className="w-full p-2.5 border rounded-lg font-bold pr-10"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold">TL</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => setEditingExpenseType(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateExpenseType}
                  className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-black shadow"
                >
                  Güncelle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KİŞİ KARTI DÜZENLEME MODALI */}
        {editingContact && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-black text-slate-900">{editingContact.id ? 'Kişi Kartını Düzenle' : 'Yeni Kişi Ekle'}</h3>
                <button onClick={() => setEditingContact(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    value={editingContact.full_name}
                    onChange={(e) => setEditingContact({ ...editingContact, full_name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kişi Türü</label>
                  <select
                    value={editingContact.contact_type}
                    onChange={(e) => setEditingContact({ ...editingContact, contact_type: e.target.value as any })}
                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="MUSTERI">Müşteri / Danışan</option>
                    <option value="ORTAK">Ortak Çalışma Temsilcisi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Firma / Kurum</label>
                  <input
                    type="text"
                    placeholder="Örn: 360 Danışmanlık"
                    value={editingContact.company || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="05XX XXX XX XX"
                    value={editingContact.phone || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    placeholder="ornek@mail.com"
                    value={editingContact.email || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notlar</label>
                  <textarea
                    rows={3}
                    placeholder="Özel notlar..."
                    value={editingContact.notes || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => setEditingContact(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveContact}
                  className="w-1/2 bg-slate-900 hover:bg-black text-amber-400 py-2.5 rounded-xl text-xs font-black shadow"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GEÇMİŞ İŞLEM DETAY MODAL */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-lg font-black">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">İşlem Detay Bordrosu</h3>
                    <p className="text-xs text-slate-400">Kayıt No: {selectedHistoryItem.id.slice(0, 8)} • İşlem Tarihi: {new Date(selectedHistoryItem.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadPDFFromRef(modalPdfRef)}
                    disabled={isPdfLoading}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow transition"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF / Yazdır
                  </button>
                  <button
                    onClick={() => loadHistoryItemToCalculator(selectedHistoryItem)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl font-bold text-xs border border-slate-700 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(selectedHistoryItem.id)}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                  <button
                    onClick={() => setSelectedHistoryItem(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
                <div ref={modalPdfRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                  
                  <div className="flex justify-between items-end border-b-2 border-slate-900 pb-3">
                    <div>
                      <span className="text-xs font-black text-amber-600 uppercase">360 IC - Investor Community</span>
                      <h4 className="text-xl font-black text-slate-900">İŞLEM VE HAK EDİŞ BORDROSU</h4>
                      <p className="text-xs text-slate-500 font-bold">İşlem Tarihi: {new Date(selectedHistoryItem.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="text-right bg-slate-900 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">{selectedHistoryItem.transaction_type} BEDELİ</span>
                      <span className="text-lg font-black text-white">{formatMoney(Number(selectedHistoryItem.property_price))}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Satıcı */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="font-black text-slate-900 border-b pb-1 flex justify-between">
                        <span className="text-amber-600">Satıcı Tarafı</span>
                        <span className="text-slate-500">Danışman: {agents.find(a => a.id === selectedHistoryItem.seller_agent_id)?.full_name || 'Belirtilmedi'}</span>
                      </div>
                      <div className="flex justify-between"><span>Müşteri:</span><b>{selectedHistoryItem.seller_name}</b></div>
                      <div className="flex justify-between"><span>Komisyon Matrahı:</span><b>{formatMoney(Number(selectedHistoryItem.seller_base_commission))}</b></div>
                      <div className="flex justify-between"><span>Fatura KDV:</span><b>{formatMoney(Number(selectedHistoryItem.seller_tax_amount))}</b></div>
                      {Number(selectedHistoryItem.seller_tax_deduction) > 0 && (
                        <div className="flex justify-between text-amber-900 font-bold"><span>Gelir Vergisi Kesintisi (%25):</span><b>- {formatMoney(Number(selectedHistoryItem.seller_tax_deduction))}</b></div>
                      )}
                      {selectedHistoryItem.seller_has_partnership && (
                        <div className="flex justify-between text-red-600"><span>Ortak Payı ({selectedHistoryItem.seller_partner_name}):</span><b>- {formatMoney(Number(selectedHistoryItem.seller_partner_share))}</b></div>
                      )}
                      {selectedItemExpenses.filter(e => e.side === 'SELLER').map((e, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-500 pl-2">
                          <span>• {e.custom_description}:</span>
                          <span>- {formatMoney(Number(e.amount))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-amber-700 font-black pt-1.5 border-t text-sm">
                        <span>Danışman Net Hak Ediş:</span>
                        <span>{formatMoney(Number(selectedHistoryItem.seller_agent_net_earning))}</span>
                      </div>
                    </div>

                    {/* Alıcı */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="font-black text-slate-900 border-b pb-1 flex justify-between">
                        <span className="text-emerald-600">Alıcı Tarafı</span>
                        <span className="text-slate-500">Danışman: {agents.find(a => a.id === selectedHistoryItem.buyer_agent_id)?.full_name || 'Belirtilmedi'}</span>
                      </div>
                      <div className="flex justify-between"><span>Müşteri:</span><b>{selectedHistoryItem.buyer_name}</b></div>
                      <div className="flex justify-between"><span>Komisyon Matrahı:</span><b>{formatMoney(Number(selectedHistoryItem.buyer_base_commission))}</b></div>
                      <div className="flex justify-between"><span>Fatura KDV:</span><b>{formatMoney(Number(selectedHistoryItem.buyer_tax_amount))}</b></div>
                      {Number(selectedHistoryItem.buyer_tax_deduction) > 0 && (
                        <div className="flex justify-between text-emerald-900 font-bold"><span>Gelir Vergisi Kesintisi (%25):</span><b>- {formatMoney(Number(selectedHistoryItem.buyer_tax_deduction))}</b></div>
                      )}
                      {selectedHistoryItem.buyer_has_partnership && (
                        <div className="flex justify-between text-red-600"><span>Ortak Payı ({selectedHistoryItem.buyer_partner_name}):</span><b>- {formatMoney(Number(selectedHistoryItem.buyer_partner_share))}</b></div>
                      )}
                      {selectedItemExpenses.filter(e => e.side === 'BUYER').map((e, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-500 pl-2">
                          <span>• {e.custom_description}:</span>
                          <span>- {formatMoney(Number(e.amount))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-emerald-700 font-black pt-1.5 border-t text-sm">
                        <span>Danışman Net Hak Ediş:</span>
                        <span>{formatMoney(Number(selectedHistoryItem.buyer_agent_net_earning))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] text-amber-400 font-black uppercase tracking-wider block">360 IC - ŞİRKET NET KAZANCI</span>
                      <span className="text-xs text-slate-400">Brüt Gelir: {formatMoney(Number(selectedHistoryItem.total_transaction_gross))}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-400">{formatMoney(Number(selectedHistoryItem.total_office_net_income))}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}