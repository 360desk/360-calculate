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
  KeyRound,
  Target,
  Check,
  Clock,
  Briefcase,
  Home,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw
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
  CartesianGrid,
  Legend
} from 'recharts';

interface Agent {
  id: string;
  code: string;
  full_name: string;
  commission_rate: number;
  office_name?: string;
  is_partner?: boolean;
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

interface Property {
  id: string;
  created_at: string;
  property_number: string;
  title: string;
  owner_names: string[];
  city?: string;
  notes?: string;
}

interface CustomerEntry {
  id: string;
  mode: 'select' | 'new';
  name: string;
}

interface TargetTemplate {
  id: string;
  title: string;
  target_type: 'SATIŞ' | 'KİRALAMA';
  period_type: 'AYLIK' | '3_AYLIK';
  target_count: number;
  reward_type: 'PERCENT' | 'FIXED';
  reward_value: number;
}

interface AgentTarget {
  id: string;
  created_at: string;
  agent_id: string;
  title: string;
  target_type: 'SATIŞ' | 'KİRALAMA';
  period_type: 'AYLIK' | '3_AYLIK';
  start_date: string;
  end_date: string;
  target_count: number;
  reward_type: 'PERCENT' | 'FIXED';
  reward_value: number;
  is_paid: boolean;
  paid_at?: string;
}

interface TransactionDetailRecord {
  id: string;
  created_at: string;
  transaction_code?: string;
  transaction_type: string;
  property_number?: string;
  property_title?: string;
  property_price: number;
  tax_rate: number;

  seller_name: string;
  seller_parties?: string[];
  seller_agent_id: string;
  seller_commission_type: string;
  seller_commission_value: number;
  seller_base_commission: number;
  seller_invoice_type: string;
  seller_invoice_tax_included?: boolean;
  seller_invoice_amount: number;
  seller_tax_amount: number;
  seller_tax_deduction?: number;
  seller_corporate_share?: number;
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
  buyer_parties?: string[];
  buyer_agent_id: string;
  buyer_commission_type: string;
  buyer_commission_value: number;
  buyer_base_commission: number;
  buyer_invoice_type: string;
  buyer_invoice_tax_included?: boolean;
  buyer_invoice_amount: number;
  buyer_tax_amount: number;
  buyer_tax_deduction?: number;
  buyer_corporate_share?: number;
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
  return `${Math.round(val).toLocaleString('tr-TR')} TL`;
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
const TOP3_COLORS = ['#f59e0b', '#3b82f6', '#10b981'];
const MASTER_PASSWORD = 't74B78s03##';

export default function RealEstateCalculator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'calculator' | 'properties' | 'settings' | 'history' | 'analytics' | 'contacts' | 'targets'>('calculator');
  const [analyticsSubView, setAnalyticsSubView] = useState<'general' | 'portfolio'>('general');
  const [isCapitalAccordionOpen, setIsCapitalAccordionOpen] = useState<boolean>(false);

  const [taxRate, setTaxRate] = useState<number>(20);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactionsHistory, setTransactionsHistory] = useState<TransactionDetailRecord[]>([]);
  const [targetTemplates, setTargetTemplates] = useState<TargetTemplate[]>([]);
  const [agentTargets, setAgentTargets] = useState<AgentTarget[]>([]);

  // Filtreler
  const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>('bar');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'this_year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('');

  // Düzenleme modalları
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingExpenseType, setEditingExpenseType] = useState<ExpenseType | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');
  const [propertySearchQuery, setPropertySearchQuery] = useState<string>('');

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TransactionDetailRecord | null>(null);
  const [selectedItemExpenses, setSelectedItemExpenses] = useState<any[]>([]);

  // İşlem Kaydetme & Kilitleme
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavedLocked, setIsSavedLocked] = useState<boolean>(false);
  const [savedTransactionCode, setSavedTransactionCode] = useState<string>('');
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const modalPdfRef = useRef<HTMLDivElement>(null);

  // Yeni Tanımlar
  const [newAgentCode, setNewAgentCode] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRate, setNewAgentRate] = useState<number>(50);
  const [newAgentOffice, setNewAgentOffice] = useState('Merkez Ofis');
  const [newAgentIsPartner, setNewAgentIsPartner] = useState<boolean>(false);
  const [newExpName, setNewExpName] = useState('');
  const [newExpCost, setNewExpCost] = useState<number>(0);

  // Yeni Mülk Tanımı Formu
  const [newPropNo, setNewPropNo] = useState('');
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropOwners, setNewPropOwners] = useState<string[]>(['']);
  const [newPropCity, setNewPropCity] = useState('Bursa');
  const [newPropNotes, setNewPropNotes] = useState('');

  // İşlem Parametreleri
  const [transactionDate, setTransactionDate] = useState<string>(getTodayISODate());
  const [propertyPrice, setPropertyPrice] = useState<number>(1000000);
  const [transactionType, setTransactionType] = useState<string>('SATIŞ');

  // Taşınmaz Seçim State'i
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [manualPropertyNo, setManualPropertyNo] = useState<string>('');
  const [manualPropertyTitle, setManualPropertyTitle] = useState<string>('');

  // Satıcı / Kiraya Veren Müşteri Listesi
  const [sellerCustomers, setSellerCustomers] = useState<CustomerEntry[]>([
    { id: '1', mode: 'select', name: '' }
  ]);
  const [sellerAgentId, setSellerAgentId] = useState<string>('');
  const [sellerCommType, setSellerCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [sellerCommValue, setSellerCommValue] = useState<number>(2);
  const [sellerInvoiceType, setSellerInvoiceType] = useState<'unbilled' | 'full' | 'partial'>('unbilled');
  const [sellerInvoiceTaxIncluded, setSellerInvoiceTaxIncluded] = useState<boolean>(false);
  const [sellerInvoiceAmount, setSellerInvoiceAmount] = useState<number>(0);
  const [sellerHasPartner, setSellerHasPartner] = useState<boolean>(false);
  const [sellerPartnerMode, setSellerPartnerMode] = useState<'select' | 'new'>('select');
  const [sellerPartnerName, setSellerPartnerName] = useState<string>('');
  const [sellerPartnerReason, setSellerPartnerReason] = useState<string>('');
  const [sellerPartnerShare, setSellerPartnerShare] = useState<number>(0);
  const [sellerExpenses, setSellerExpenses] = useState<ExpenseItem[]>([]);

  // Alıcı / Kiralayan Müşteri Listesi
  const [buyerCustomers, setBuyerCustomers] = useState<CustomerEntry[]>([
    { id: '1', mode: 'select', name: '' }
  ]);
  const [buyerAgentId, setBuyerAgentId] = useState<string>('');
  const [buyerCommType, setBuyerCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [buyerCommValue, setBuyerCommValue] = useState<number>(2);
  const [buyerInvoiceType, setBuyerInvoiceType] = useState<'unbilled' | 'full' | 'partial'>('unbilled');
  const [buyerInvoiceTaxIncluded, setBuyerInvoiceTaxIncluded] = useState<boolean>(false);
  const [buyerInvoiceAmount, setBuyerInvoiceAmount] = useState<number>(0);
  const [buyerHasPartner, setBuyerHasPartner] = useState<boolean>(false);
  const [buyerPartnerMode, setBuyerPartnerMode] = useState<'select' | 'new'>('select');
  const [buyerPartnerName, setBuyerPartnerName] = useState<string>('');
  const [buyerPartnerReason, setBuyerPartnerReason] = useState<string>('');
  const [buyerPartnerShare, setBuyerPartnerShare] = useState<number>(0);
  const [buyerExpenses, setBuyerExpenses] = useState<ExpenseItem[]>([]);

  // Hedef Modülü
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [targetTitle, setTargetTitle] = useState<string>('');
  const [targetType, setTargetType] = useState<'SATIŞ' | 'KİRALAMA'>('SATIŞ');
  const [targetPeriod, setTargetPeriod] = useState<'AYLIK' | '3_AYLIK'>('AYLIK');
  const [targetStartDate, setTargetStartDate] = useState<string>(getTodayISODate());
  const [targetEndDate, setTargetEndDate] = useState<string>(getTodayISODate());
  const [targetCount, setTargetCount] = useState<number>(3);
  const [targetRewardType, setTargetRewardType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [targetRewardValue, setTargetRewardValue] = useState<number>(5);

  const [newTplTitle, setNewTplTitle] = useState<string>('');
  const [newTplType, setNewTplType] = useState<'SATIŞ' | 'KİRALAMA'>('SATIŞ');
  const [newTplPeriod, setNewTplPeriod] = useState<'AYLIK' | '3_AYLIK'>('AYLIK');
  const [newTplCount, setNewTplCount] = useState<number>(3);
  const [newTplRewardType, setNewTplRewardType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newTplRewardValue, setNewTplRewardValue] = useState<number>(5);

  useEffect(() => {
    const sessionAuth = localStorage.getItem('360ic_auth_token');
    if (sessionAuth === 'authenticated') setIsAuthenticated(true);
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

    const { data: propData } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (propData) setProperties(propData as Property[]);

    const { data: transData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (transData) setTransactionsHistory(transData as TransactionDetailRecord[]);

    const { data: tplData } = await supabase.from('target_templates').select('*').order('created_at', { ascending: false });
    if (tplData) setTargetTemplates(tplData as TargetTemplate[]);

    const { data: tgData } = await supabase.from('agent_targets').select('*').order('created_at', { ascending: false });
    if (tgData) setAgentTargets(tgData as AgentTarget[]);
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const activeAgents = useMemo(() => agents.filter(a => a.is_active !== false), [agents]);

  const officeList = useMemo(() => {
    const list = Array.from(new Set(agents.map(a => a.office_name || 'Merkez Ofis').filter(Boolean)));
    return list.length > 0 ? list : ['Merkez Ofis'];
  }, [agents]);

  // Dinamik Terimler
  const isRent = transactionType === 'KİRALAMA';
  const sellerTitle = isRent ? 'Kiraya Veren' : 'Satıcı Tarafı';
  const buyerTitle = isRent ? 'Kiralayan / Kiracı' : 'Alıcı Tarafı';

  // Dinamik Müşteri Fonksiyonları
  const addSellerCustomer = () => {
    setSellerCustomers([...sellerCustomers, { id: Math.random().toString(), mode: 'select', name: '' }]);
  };

  const removeSellerCustomer = (id: string) => {
    if (sellerCustomers.length === 1) {
      setSellerCustomers([{ id: Math.random().toString(), mode: 'select', name: '' }]);
      return;
    }
    setSellerCustomers(sellerCustomers.filter(c => c.id !== id));
  };

  const updateSellerCustomer = (id: string, field: 'mode' | 'name', value: any) => {
    setSellerCustomers(sellerCustomers.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addBuyerCustomer = () => {
    setBuyerCustomers([...buyerCustomers, { id: Math.random().toString(), mode: 'select', name: '' }]);
  };

  const removeBuyerCustomer = (id: string) => {
    if (buyerCustomers.length === 1) {
      setBuyerCustomers([{ id: Math.random().toString(), mode: 'select', name: '' }]);
      return;
    }
    setBuyerCustomers(buyerCustomers.filter(c => c.id !== id));
  };

  const updateBuyerCustomer = (id: string, field: 'mode' | 'name', value: any) => {
    setBuyerCustomers(buyerCustomers.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const allSellerNames = useMemo(() => sellerCustomers.map(c => c.name.trim()).filter(Boolean), [sellerCustomers]);
  const allBuyerNames = useMemo(() => buyerCustomers.map(c => c.name.trim()).filter(Boolean), [buyerCustomers]);

  // Taşınmaz Seçildiğinde Otomatik Sahip Doldurma
  const handleSelectProperty = (propId: string) => {
    setSelectedPropertyId(propId);
    if (!propId) {
      setManualPropertyNo('');
      setManualPropertyTitle('');
      return;
    }
    const prop = properties.find(p => p.id === propId);
    if (prop) {
      setManualPropertyNo(prop.property_number);
      setManualPropertyTitle(prop.title);
      if (prop.owner_names && prop.owner_names.length > 0) {
        setSellerCustomers(prop.owner_names.map((name, i) => ({
          id: (i + 1).toString(),
          mode: 'new',
          name: name
        })));
      }
    }
  };

  // Müşteriye Göre Taşınmazları Filtreleme
  const availablePropertiesForSeller = useMemo(() => {
    if (allSellerNames.length === 0) return properties;
    return properties.filter(p => 
      p.owner_names && p.owner_names.some(owner => allSellerNames.includes(owner))
    );
  }, [properties, allSellerNames]);

  // KOMİSYON & HAK EDİŞ HESAP MOTORU
  const selectedSellerAgent = agents.find(a => a.id === sellerAgentId);
  const selectedBuyerAgent = agents.find(a => a.id === buyerAgentId);

  // Satıcı / Kiraya Veren Komisyon Matrahı
  const sellerBaseComm = isRent 
    ? (propertyPrice / 2) 
    : (sellerCommType === 'percentage' ? (propertyPrice * (sellerCommValue || 0)) / 100 : (sellerCommValue || 0));

  // Satıcı Fatura Hesabı (Kiralamada Kiraya Verene Fatura Kesilmez)
  let sellerNetInvoiceBase = 0;
  let sellerTaxAmount = 0;

  if (!isRent && sellerInvoiceType !== 'unbilled') {
    if (sellerInvoiceType === 'full') {
      if (sellerInvoiceTaxIncluded) {
        sellerNetInvoiceBase = sellerBaseComm / (1 + taxRate / 100);
        sellerTaxAmount = sellerBaseComm - sellerNetInvoiceBase;
      } else {
        sellerNetInvoiceBase = sellerBaseComm;
        sellerTaxAmount = (sellerNetInvoiceBase * taxRate) / 100;
      }
    } else if (sellerInvoiceType === 'partial') {
      const rawVal = sellerInvoiceAmount || 0;
      if (sellerInvoiceTaxIncluded) {
        sellerNetInvoiceBase = rawVal / (1 + taxRate / 100);
        sellerTaxAmount = rawVal - sellerNetInvoiceBase;
      } else {
        sellerNetInvoiceBase = rawVal;
        sellerTaxAmount = (sellerNetInvoiceBase * taxRate) / 100;
      }
    }
  }

  const sellerTotalGross = sellerBaseComm + (sellerInvoiceTaxIncluded ? 0 : sellerTaxAmount);

  // Ortak Danışman Mantığı (Brüt %80, Ödeme %70, Kurumsal Sermaye Payı %10)
  const isSellerPartner = selectedSellerAgent?.is_partner === true;
  const sellerAgentAppliedRate = selectedSellerAgent 
    ? (isSellerPartner ? 80 : selectedSellerAgent.commission_rate) 
    : 50;
  const sellerAgentPayoutRate = isSellerPartner ? 70 : sellerAgentAppliedRate;

  const sellerAgentGross = (sellerBaseComm * sellerAgentAppliedRate) / 100;
  const sellerCorporateShare = isSellerPartner ? (sellerBaseComm * 10) / 100 : 0;
  const sellerTaxDeduction = (sellerNetInvoiceBase * 0.25 * (sellerAgentPayoutRate / 100));
  const sellerTotalExpenseAmount = sellerExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const sellerPartnerAmount = sellerHasPartner ? (Number(sellerPartnerShare) || 0) : 0;
  const sellerAgentNet = Math.max(0, (sellerBaseComm * sellerAgentPayoutRate) / 100 - sellerPartnerAmount - sellerTotalExpenseAmount - sellerTaxDeduction);
  const sellerOfficeNet = Math.max(0, sellerBaseComm - sellerAgentGross + sellerCorporateShare);

  // Alıcı / Kiralayan Komisyon Matrahı
  const buyerBaseComm = isRent 
    ? (propertyPrice / 2) 
    : (buyerCommType === 'percentage' ? (propertyPrice * (buyerCommValue || 0)) / 100 : (buyerCommValue || 0));

  // Alıcı Fatura Hesabı (Kiralamada Kiralayan Tam Fatura İsterse Tüm Kira Bedeli 1 Kira Üzerinden Kesilir)
  let buyerNetInvoiceBase = 0;
  let buyerTaxAmount = 0;

  if (buyerInvoiceType !== 'unbilled') {
    if (buyerInvoiceType === 'full') {
      const targetBase = isRent ? propertyPrice : buyerBaseComm;
      if (buyerInvoiceTaxIncluded) {
        buyerNetInvoiceBase = targetBase / (1 + taxRate / 100);
        buyerTaxAmount = targetBase - buyerNetInvoiceBase;
      } else {
        buyerNetInvoiceBase = targetBase;
        buyerTaxAmount = (buyerNetInvoiceBase * taxRate) / 100;
      }
    } else if (buyerInvoiceType === 'partial') {
      const rawVal = buyerInvoiceAmount || 0;
      if (buyerInvoiceTaxIncluded) {
        buyerNetInvoiceBase = rawVal / (1 + taxRate / 100);
        buyerTaxAmount = rawVal - buyerNetInvoiceBase;
      } else {
        buyerNetInvoiceBase = rawVal;
        buyerTaxAmount = (buyerNetInvoiceBase * taxRate) / 100;
      }
    }
  }

  const buyerTotalGross = buyerBaseComm + (buyerInvoiceTaxIncluded ? 0 : buyerTaxAmount);

  const isBuyerPartner = selectedBuyerAgent?.is_partner === true;
  const buyerAgentAppliedRate = selectedBuyerAgent 
    ? (isBuyerPartner ? 80 : selectedBuyerAgent.commission_rate) 
    : 50;
  const buyerAgentPayoutRate = isBuyerPartner ? 70 : buyerAgentAppliedRate;

  const buyerAgentGross = (buyerBaseComm * buyerAgentAppliedRate) / 100;
  const buyerCorporateShare = isBuyerPartner ? (buyerBaseComm * 10) / 100 : 0;
  const buyerTaxDeduction = (buyerNetInvoiceBase * 0.25 * (buyerAgentPayoutRate / 100));
  const buyerTotalExpenseAmount = buyerExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const buyerPartnerAmount = buyerHasPartner ? (Number(buyerPartnerShare) || 0) : 0;
  const buyerAgentNet = Math.max(0, (buyerBaseComm * buyerAgentPayoutRate) / 100 - buyerPartnerAmount - buyerTotalExpenseAmount - buyerTaxDeduction);
  const buyerOfficeNet = Math.max(0, buyerBaseComm - buyerAgentGross + buyerCorporateShare);

  // Toplamlar
  const totalGrossCollection = sellerTotalGross + buyerTotalGross;
  const totalAgentEarnings = sellerAgentNet + buyerAgentNet;
  const totalCorporateShares = sellerCorporateShare + buyerCorporateShare;
  const totalPartnerShares = sellerPartnerAmount + buyerPartnerAmount;
  const totalExpenses = sellerTotalExpenseAmount + buyerTotalExpenseAmount;
  const totalTaxAmount = sellerTaxAmount + buyerTaxAmount;
  const totalTaxDeductions = sellerTaxDeduction + buyerTaxDeduction;
  const grandTotalDeductions = totalAgentEarnings + totalPartnerShares + totalExpenses + totalTaxAmount + totalTaxDeductions + totalCorporateShares;
  const totalOfficeNetIncome = sellerOfficeNet + buyerOfficeNet;

  // Gider İşlemleri
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
      if (selectedTypeId === 'custom') return { ...item, expense_type_id: 'custom', custom_description: '', amount: 0 };
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
    const updater = (list: ExpenseItem[]) => list.map(item => item.id === itemId ? { ...item, [field]: value } : item);
    if (side === 'seller') setSellerExpenses(updater(sellerExpenses));
    else setBuyerExpenses(updater(buyerExpenses));
  };

  // 1 Sayfa A4 PDF Çıktısı
  const downloadPDFFromRef = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
    if (!targetRef.current) return;
    setIsPdfLoading(true);
    try {
      const element = targetRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const renderHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (renderHeight > pdfHeight) {
        const adjustedWidth = (imgProps.width * pdfHeight) / imgProps.height;
        const xOffset = (pdfWidth - adjustedWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, adjustedWidth, pdfHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, renderHeight);
      }
      pdf.save(`360IC-${savedTransactionCode || 'Bordro'}.pdf`);
    } catch {
      window.print();
    } finally {
      setIsPdfLoading(false);
    }
  };

  // İŞLEM KAYDETME (Mükerrer Kayıt Kilidi, Kod Üretimi & Mülkiyet Devri)
  const saveTransaction = async () => {
    if (!manualPropertyNo.trim()) {
      return alert('Lütfen işleme konu Gayrimenkulün Taşınmaz Numarasını girin veya listeden seçin!');
    }
    if (allSellerNames.length === 0 || allBuyerNames.length === 0) {
      return alert('Lütfen hem Satıcı/Kiraya Veren hem de Alıcı/Kiracı müşterilerini girin.');
    }

    setIsSaving(true);
    try {
      const chosenTimestamp = new Date(transactionDate + 'T12:00:00Z').toISOString();
      const yearShort = new Date(transactionDate).getFullYear().toString().slice(-2);

      // Sıradaki İşlem Kodu (360IC-YY-XXX)
      const countForYear = transactionsHistory.filter(t => new Date(t.created_at).getFullYear().toString().slice(-2) === yearShort).length + 1;
      const genCode = `360IC-${yearShort}-${countForYear.toString().padStart(3, '0')}`;

      // Taşınmazı Properties tablosuna kaydet veya güncelle
      let targetProp = properties.find(p => p.property_number === manualPropertyNo.trim());
      if (!targetProp) {
        const { data: newProp } = await supabase.from('properties').insert({
          property_number: manualPropertyNo.trim(),
          title: manualPropertyTitle.trim() || 'Tanımsız Taşınmaz',
          owner_names: allSellerNames,
          city: 'Bursa'
        }).select().single();
        targetProp = newProp;
      }

      // SATIŞ ise mülkiyeti otomatik alıcıya geçir
      if (transactionType === 'SATIŞ' && targetProp) {
        await supabase.from('properties').update({
          owner_names: allBuyerNames
        }).eq('id', targetProp.id);
      }

      // İşlemi Kaydet
      const { data: trans, error: transError } = await supabase.from('transactions').insert({
        created_at: chosenTimestamp,
        transaction_code: genCode,
        transaction_type: transactionType,
        property_number: manualPropertyNo.trim(),
        property_title: manualPropertyTitle.trim() || targetProp?.title,
        property_price: propertyPrice,
        tax_rate: taxRate,

        seller_name: allSellerNames[0] || 'Belirtilmedi',
        seller_parties: allSellerNames,
        seller_agent_id: sellerAgentId || null,
        seller_commission_type: sellerCommType,
        seller_commission_value: sellerCommValue,
        seller_base_commission: sellerBaseComm,
        seller_invoice_type: isRent ? 'unbilled' : sellerInvoiceType,
        seller_invoice_tax_included: sellerInvoiceTaxIncluded,
        seller_invoice_amount: sellerNetInvoiceBase,
        seller_tax_amount: sellerTaxAmount,
        seller_tax_deduction: sellerTaxDeduction,
        seller_corporate_share: sellerCorporateShare,
        seller_total_gross_income: sellerTotalGross,
        seller_has_partnership: sellerHasPartner,
        seller_partner_name: sellerPartnerName,
        seller_partner_reason: sellerPartnerReason,
        seller_partner_share: sellerPartnerShare,
        seller_agent_rate_applied: sellerAgentAppliedRate,
        seller_agent_gross_earning: sellerAgentGross,
        seller_agent_total_expenses: sellerTotalExpenseAmount,
        seller_agent_net_earning: sellerAgentNet,
        seller_office_net_share: sellerOfficeNet,

        buyer_name: allBuyerNames[0] || 'Belirtilmedi',
        buyer_parties: allBuyerNames,
        buyer_agent_id: buyerAgentId || null,
        buyer_commission_type: buyerCommType,
        buyer_commission_value: buyerCommValue,
        buyer_base_commission: buyerBaseComm,
        buyer_invoice_type: buyerInvoiceType,
        buyer_invoice_tax_included: buyerInvoiceTaxIncluded,
        buyer_invoice_amount: buyerNetInvoiceBase,
        buyer_tax_amount: buyerTaxAmount,
        buyer_tax_deduction: buyerTaxDeduction,
        buyer_corporate_share: buyerCorporateShare,
        buyer_total_gross_income: buyerTotalGross,
        buyer_has_partnership: buyerHasPartner,
        buyer_partner_name: buyerPartnerName,
        buyer_partner_reason: buyerPartnerReason,
        buyer_partner_share: buyerPartnerShare,
        buyer_agent_rate_applied: buyerAgentAppliedRate,
        buyer_agent_gross_earning: buyerAgentGross,
        buyer_agent_total_expenses: buyerTotalExpenseAmount,
        buyer_agent_net_earning: buyerAgentNet,
        buyer_office_net_share: buyerOfficeNet,

        total_transaction_gross: totalGrossCollection,
        total_office_net_income: totalOfficeNetIncome
      }).select().single();

      if (transError) throw transError;

      // CRM Rehberini Güncelle
      const contactsToSync: { full_name: string; contact_type: 'MUSTERI' | 'ORTAK' }[] = [];
      allSellerNames.forEach(n => contactsToSync.push({ full_name: n, contact_type: 'MUSTERI' }));
      allBuyerNames.forEach(n => contactsToSync.push({ full_name: n, contact_type: 'MUSTERI' }));
      if (sellerPartnerName) contactsToSync.push({ full_name: sellerPartnerName, contact_type: 'ORTAK' });
      if (buyerPartnerName) contactsToSync.push({ full_name: buyerPartnerName, contact_type: 'ORTAK' });

      for (const c of contactsToSync) {
        try { await supabase.from('contacts').insert(c); } catch {}
      }

      // Giderler
      const expensesToInsert = [
        ...sellerExpenses.map(e => ({
          transaction_id: trans.id,
          side: 'SELLER',
          expense_type_id: e.expense_type_id !== 'custom' ? e.expense_type_id : null,
          custom_description: e.custom_description || 'Gider',
          amount: Number(e.amount) || 0
        })),
        ...buyerExpenses.map(e => ({
          transaction_id: trans.id,
          side: 'BUYER',
          expense_type_id: e.expense_type_id !== 'custom' ? e.expense_type_id : null,
          custom_description: e.custom_description || 'Gider',
          amount: Number(e.amount) || 0
        }))
      ];
      if (expensesToInsert.length > 0) {
        await supabase.from('transaction_expenses').insert(expensesToInsert);
      }

      setSavedTransactionCode(genCode);
      setIsSavedLocked(true); // Butonu kilitle
      loadData();
    } catch (err: any) {
      alert('Kayıt hatası: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForm = () => {
    setIsSavedLocked(false);
    setSavedTransactionCode('');
    setPropertyPrice(1000000);
    setManualPropertyNo('');
    setManualPropertyTitle('');
    setSelectedPropertyId('');
    setSellerCustomers([{ id: '1', mode: 'select', name: '' }]);
    setBuyerCustomers([{ id: '1', mode: 'select', name: '' }]);
    setSellerExpenses([]);
    setBuyerExpenses([]);
  };

  // RAPOR & ANALİZ FİLTRELEME
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

      const sellerAg = agents.find(a => a.id === t.seller_agent_id);
      const buyerAg = agents.find(a => a.id === t.buyer_agent_id);

      if (selectedOfficeFilter !== 'all') {
        const sellerOfficeMatch = sellerAg && (sellerAg.office_name || 'Merkez Ofis') === selectedOfficeFilter;
        const buyerOfficeMatch = buyerAg && (buyerAg.office_name || 'Merkez Ofis') === selectedOfficeFilter;
        if (!sellerOfficeMatch && !buyerOfficeMatch) return false;
      }

      if (selectedAgentFilter !== 'all') {
        if (t.seller_agent_id !== selectedAgentFilter && t.buyer_agent_id !== selectedAgentFilter) return false;
      }

      return true;
    });
  }, [transactionsHistory, dateFilter, customStartDate, customEndDate, selectedAgentFilter, selectedOfficeFilter, agents]);

  // ORTAKLAR ŞİRKET SERMAYESİ TAKİBİ
  const partnerCapitalStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const partnerAgents = agents.filter(a => a.is_partner === true);
    
    const partnerList = partnerAgents.map(ag => {
      let totalCorporateCapital = 0;
      transactionsHistory.forEach(t => {
        const d = new Date(t.created_at);
        if (d.getFullYear() === currentYear) {
          if (t.seller_agent_id === ag.id) totalCorporateCapital += Number(t.seller_corporate_share) || 0;
          if (t.buyer_agent_id === ag.id) totalCorporateCapital += Number(t.buyer_corporate_share) || 0;
        }
      });
      return {
        id: ag.id,
        code: ag.code,
        name: ag.full_name,
        office: ag.office_name || 'Merkez',
        totalCorporateCapital
      };
    });

    const grandTotalCapital = partnerList.reduce((acc, curr) => acc + curr.totalCorporateCapital, 0);
    return { partnerList, grandTotalCapital, currentYear };
  }, [agents, transactionsHistory]);

  // ANALİTİK ÖZETİ
  const analyticsSummary = useMemo(() => {
    let totalSalesCount = 0;
    let totalRentCount = 0;
    let totalGrossVolume = 0;
    let totalOfficeNet = 0;
    let totalAgentNetEarnings = 0;

    const agentStats: Record<string, { id: string; name: string; office: string; count: number; gross: number; agentNet: number; officeNet: number }> = {};
    const contactVolumeStats: Record<string, { count: number; totalGross: number; role: string }> = {};

    filteredTransactions.forEach(t => {
      if (t.transaction_type === 'SATIŞ') totalSalesCount++;
      else totalRentCount++;

      if (t.seller_agent_id) {
        const ag = agents.find(a => a.id === t.seller_agent_id);
        const name = ag ? `[${ag.code}] ${ag.full_name}` : 'Danışman';
        const office = ag?.office_name || 'Merkez';
        if (!agentStats[t.seller_agent_id]) agentStats[t.seller_agent_id] = { id: t.seller_agent_id, name, office, count: 0, gross: 0, agentNet: 0, officeNet: 0 };
        agentStats[t.seller_agent_id].count += 1;
        agentStats[t.seller_agent_id].gross += Number(t.seller_base_commission) || 0;
        agentStats[t.seller_agent_id].agentNet += Number(t.seller_agent_net_earning) || 0;
        agentStats[t.seller_agent_id].officeNet += Number(t.seller_office_net_share) || 0;

        if (selectedAgentFilter === t.seller_agent_id) totalAgentNetEarnings += Number(t.seller_agent_net_earning) || 0;
      }

      if (t.buyer_agent_id) {
        const ag = agents.find(a => a.id === t.buyer_agent_id);
        const name = ag ? `[${ag.code}] ${ag.full_name}` : 'Danışman';
        const office = ag?.office_name || 'Merkez';
        if (!agentStats[t.buyer_agent_id]) agentStats[t.buyer_agent_id] = { id: t.buyer_agent_id, name, office, count: 0, gross: 0, agentNet: 0, officeNet: 0 };
        agentStats[t.buyer_agent_id].count += 1;
        agentStats[t.buyer_agent_id].gross += Number(t.buyer_base_commission) || 0;
        agentStats[t.buyer_agent_id].agentNet += Number(t.buyer_agent_net_earning) || 0;
        agentStats[t.buyer_agent_id].officeNet += Number(t.buyer_office_net_share) || 0;

        if (selectedAgentFilter === t.buyer_agent_id) totalAgentNetEarnings += Number(t.buyer_agent_net_earning) || 0;
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

      // Müşteri Dağılımı (Kişi Başı Eşit Pay)
      const sParties = (t.seller_parties && t.seller_parties.length > 0) ? t.seller_parties : [t.seller_name || 'Belirtilmedi'];
      const sShare = (Number(t.seller_base_commission) || 0) / (sParties.length || 1);
      sParties.forEach(n => {
        if (n && n !== 'Belirtilmedi') {
          if (!contactVolumeStats[n]) contactVolumeStats[n] = { count: 0, totalGross: 0, role: 'Satıcı / Kiraya Veren' };
          contactVolumeStats[n].count += 1;
          contactVolumeStats[n].totalGross += sShare;
        }
      });

      const bParties = (t.buyer_parties && t.buyer_parties.length > 0) ? t.buyer_parties : [t.buyer_name || 'Belirtilmedi'];
      const bShare = (Number(t.buyer_base_commission) || 0) / (bParties.length || 1);
      bParties.forEach(n => {
        if (n && n !== 'Belirtilmedi') {
          if (!contactVolumeStats[n]) contactVolumeStats[n] = { count: 0, totalGross: 0, role: 'Alıcı / Kiracı' };
          contactVolumeStats[n].count += 1;
          contactVolumeStats[n].totalGross += bShare;
        }
      });
    });

    const topAgentsByCount = Object.values(agentStats).sort((a, b) => b.count - a.count);
    const topAgentsByGross = Object.values(agentStats).sort((a, b) => b.gross - a.gross);
    const topContactsByVolume = Object.entries(contactVolumeStats).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.totalGross - a.totalGross);

    // İlk 3 Danışman Grafikleri (Yılbaşından İtibaren)
    const currentYear = new Date().getFullYear();
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const currentMonthIdx = new Date().getMonth();
    const top3CountAgents = topAgentsByCount.slice(0, 3);
    const top3GrossAgents = topAgentsByGross.slice(0, 3);

    const top3CountTimeline = months.slice(0, currentMonthIdx + 1).map((mName, mIdx) => {
      const row: any = { month: mName };
      top3CountAgents.forEach(ag => {
        row[ag.name] = transactionsHistory.filter(t => {
          const d = new Date(t.created_at);
          return d.getFullYear() === currentYear && d.getMonth() === mIdx && (t.seller_agent_id === ag.id || t.buyer_agent_id === ag.id);
        }).length;
      });
      return row;
    });

    const top3GrossTimeline = months.slice(0, currentMonthIdx + 1).map((mName, mIdx) => {
      const row: any = { month: mName };
      top3GrossAgents.forEach(ag => {
        let grossM = 0;
        transactionsHistory.forEach(t => {
          const d = new Date(t.created_at);
          if (d.getFullYear() === currentYear && d.getMonth() === mIdx) {
            if (t.seller_agent_id === ag.id) grossM += Number(t.seller_base_commission) || 0;
            if (t.buyer_agent_id === ag.id) grossM += Number(t.buyer_base_commission) || 0;
          }
        });
        row[ag.name] = Math.round(grossM);
      });
      return row;
    });

    return {
      totalMulkTransactions: filteredTransactions.length,
      totalTarafTransactions: filteredTransactions.length * 2,
      totalSalesCount,
      totalRentCount,
      totalGrossVolume,
      totalOfficeNet,
      totalAgentNetEarnings,
      topAgentsByCount,
      topContactsByVolume,
      top3CountAgents,
      top3GrossAgents,
      top3CountTimeline,
      top3GrossTimeline
    };
  }, [filteredTransactions, transactionsHistory, agents, selectedAgentFilter]);

  // MÜLK YAŞAM DÖNGÜSÜ & TARİHÇE AKIŞI
  const selectedPropertyHistory = useMemo(() => {
    if (!selectedPropertyFilter) return [];
    return transactionsHistory.filter(t => t.property_number === selectedPropertyFilter)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [transactionsHistory, selectedPropertyFilter]);

  const selectedPropertyObj = useMemo(() => {
    return properties.find(p => p.property_number === selectedPropertyFilter);
  }, [properties, selectedPropertyFilter]);

  // CRUD Fonksiyonları (Mülk, Temsilci, Masraf vb.)
  const handleCreateProperty = async () => {
    if (!newPropNo || !newPropTitle) return alert('Taşınmaz no ve etiket başlığı zorunludur.');
    const validOwners = newPropOwners.filter(Boolean);
    const { error } = await supabase.from('properties').insert({
      property_number: newPropNo.trim(),
      title: newPropTitle.trim(),
      owner_names: validOwners,
      city: newPropCity,
      notes: newPropNotes
    });
    if (!error) {
      alert('Taşınmaz portföye kaydedildi!');
      setNewPropNo('');
      setNewPropTitle('');
      setNewPropOwners(['']);
      setNewPropNotes('');
      loadData();
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const handleUpdateProperty = async () => {
    if (!editingProperty) return;
    const { error } = await supabase.from('properties').update({
      title: editingProperty.title,
      owner_names: editingProperty.owner_names,
      city: editingProperty.city,
      notes: editingProperty.notes
    }).eq('id', editingProperty.id);
    if (!error) {
      setEditingProperty(null);
      loadData();
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Taşınmazı portföyden silmek istediğinize emin misiniz?')) return;
    await supabase.from('properties').delete().eq('id', id);
    loadData();
  };

  const handleAddAgent = async () => {
    if (!newAgentCode || !newAgentName) return alert('Danışman kodu ve adını girin.');
    await supabase.from('agents').insert({
      code: newAgentCode,
      full_name: newAgentName,
      commission_rate: newAgentIsPartner ? 80 : newAgentRate,
      office_name: newAgentOffice || 'Merkez Ofis',
      is_partner: newAgentIsPartner,
      is_active: true
    });
    setNewAgentCode('');
    setNewAgentName('');
    loadData();
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;
    await supabase.from('agents').update({
      code: editingAgent.code,
      full_name: editingAgent.full_name,
      commission_rate: editingAgent.is_partner ? 80 : editingAgent.commission_rate,
      office_name: editingAgent.office_name,
      is_partner: editingAgent.is_partner,
      is_active: editingAgent.is_active
    }).eq('id', editingAgent.id);
    setEditingAgent(null);
    loadData();
  };

  const toggleAgentActiveStatus = async (agent: Agent) => {
    await supabase.from('agents').update({ is_active: !(agent.is_active !== false) }).eq('id', agent.id);
    loadData();
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Danışmanı silmek istediğinize emin misiniz?')) return;
    await supabase.from('agents').delete().eq('id', id);
    loadData();
  };

  const handleAddExpenseType = async () => {
    if (!newExpName) return alert('Gider adını girin.');
    await supabase.from('expense_types').insert({ name: newExpName, default_cost: newExpCost });
    setNewExpName('');
    setNewExpCost(0);
    loadData();
  };

  const handleUpdateExpenseType = async () => {
    if (!editingExpenseType) return;
    await supabase.from('expense_types').update({
      name: editingExpenseType.name,
      default_cost: editingExpenseType.default_cost
    }).eq('id', editingExpenseType.id);
    setEditingExpenseType(null);
    loadData();
  };

  const handleDeleteExpenseType = async (id: string) => {
    if (!confirm('Gider türünü silmek istediğinize emin misiniz?')) return;
    await supabase.from('expense_types').delete().eq('id', id);
    loadData();
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    await supabase.from('contacts').upsert({
      id: editingContact.id || undefined,
      full_name: editingContact.full_name,
      contact_type: editingContact.contact_type,
      phone: editingContact.phone,
      email: editingContact.email,
      company: editingContact.company,
      notes: editingContact.notes
    });
    setEditingContact(null);
    loadData();
  };

  const openHistoryDetail = async (item: TransactionDetailRecord) => {
    setSelectedHistoryItem(item);
    const { data: expData } = await supabase.from('transaction_expenses').select('*').eq('transaction_id', item.id);
    setSelectedItemExpenses(expData || []);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
    await supabase.from('transaction_expenses').delete().eq('transaction_id', id);
    await supabase.from('transactions').delete().eq('id', id);
    if (selectedHistoryItem?.id === id) setSelectedHistoryItem(null);
    loadData();
  };

  // Hedef Modülü Aksiyonları
  const handleAssignTarget = async () => {
    if (!targetAgentId || !targetTitle) return alert('Lütfen danışman ve hedef başlığını girin.');
    await supabase.from('agent_targets').insert({
      agent_id: targetAgentId,
      title: targetTitle,
      target_type: targetType,
      period_type: targetPeriod,
      start_date: targetStartDate,
      end_date: targetEndDate,
      target_count: targetCount,
      reward_type: targetRewardType,
      reward_value: targetRewardValue,
      is_paid: false
    });
    alert('Hedef tanımlandı!');
    setTargetTitle('');
    loadData();
  };

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = targetTemplates.find(t => t.id === tplId);
    if (tpl) {
      setTargetTitle(tpl.title);
      setTargetType(tpl.target_type);
      setTargetPeriod(tpl.period_type);
      setTargetCount(tpl.target_count);
      setTargetRewardType(tpl.reward_type);
      setTargetRewardValue(tpl.reward_value);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTplTitle) return alert('Şablon başlığı girin.');
    await supabase.from('target_templates').insert({
      title: newTplTitle,
      target_type: newTplType,
      period_type: newTplPeriod,
      target_count: newTplCount,
      reward_type: newTplRewardType,
      reward_value: newTplRewardValue
    });
    alert('Şablon kaydedildi!');
    setNewTplTitle('');
    loadData();
  };

  const toggleTargetPaid = async (targetId: string, currentStatus: boolean) => {
    await supabase.from('agent_targets').update({
      is_paid: !currentStatus,
      paid_at: !currentStatus ? new Date().toISOString() : null
    }).eq('id', targetId);
    loadData();
  };

  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm('Hedefi silmek istediğinize emin misiniz?')) return;
    await supabase.from('agent_targets').delete().eq('id', targetId);
    loadData();
  };

  // Giriş Ekranı
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 mb-2">
            <Building2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">360 IC Türkiye</h1>
            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mt-1">Yönetim, Taşınmaz & Hak Ediş Portalı</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">Lütfen erişim şifresini girin.</p>
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
              {authError && <p className="text-xs text-red-400 font-bold mt-2">{authError}</p>}
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
        
        {/* ÜST BAR & SEKMELER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-xl text-amber-500 shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">360 IC <span className="font-light text-slate-400">|</span> Investor Community</h1>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-0.5">Gayrimenkul Portföy, Taşınmaz & Hak Ediş</p>
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
                onClick={() => setActiveTab('properties')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'properties' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Home className="w-4 h-4 text-emerald-500" /> Mülk Portföyü ({properties.length})
              </button>
              <button
                onClick={() => setActiveTab('targets')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'targets' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Target className="w-4 h-4 text-amber-500" /> Hedef & Prim
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
              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition font-bold text-xs"
              title="Oturumu Kapat"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. SEKME: İŞLEM HESAPLAMA */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">İşlem Durumu:</span>
                {isSavedLocked ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                    <Check className="w-4 h-4" /> {savedTransactionCode} Sisteme Kaydedildi
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                    Taslak / Yeni Kayıt
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isSavedLocked ? (
                  <>
                    <button
                      onClick={() => setIsSavedLocked(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Kilidi Aç / Düzenle
                    </button>
                    <button
                      onClick={handleResetForm}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Yeni İşlem Başlat
                    </button>
                  </>
                ) : (
                  <button
                    onClick={saveTransaction}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl font-bold shadow transition disabled:opacity-50 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSaving ? 'Kaydediliyor...' : 'İşlemi Kaydet'}
                  </button>
                )}

                <button
                  onClick={() => downloadPDFFromRef(pdfRef)}
                  disabled={isPdfLoading}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 px-5 py-2 rounded-xl font-bold shadow transition text-xs border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  {isPdfLoading ? 'Hazırlanıyor...' : '1 Sayfa A4 PDF İndir'}
                </button>
              </div>
            </div>

            {/* Zorunlu Taşınmaz & İşlem Parametreleri */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Taşınmaz No Seç/Gir (Zorunlu) */}
                <div className="lg:col-span-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-amber-600" />
                      İşleme Konu Taşınmaz (Zorunlu)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSelectProperty('')}
                      className="text-[10px] font-bold text-amber-700 hover:underline"
                    >
                      Yeni / Elle Gir
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => handleSelectProperty(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                    >
                      <option value="">Portföyden Mülk Seç</option>
                      {availablePropertiesForSeller.map(p => (
                        <option key={p.id} value={p.id}>[{p.property_number}] {p.title}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Taşınmaz No (Örn: 1252023525)"
                      value={manualPropertyNo}
                      onChange={(e) => setManualPropertyNo(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Mülk Etiket İsmi (Örn: Rota Blok B 30 Bursa)"
                    value={manualPropertyTitle}
                    onChange={(e) => setManualPropertyTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> İşlem Tarihi
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">İşlem Türü</label>
                  <select 
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-black text-xs"
                  >
                    <option value="SATIŞ">🏢 Satış İşlemi</option>
                    <option value="KİRALAMA">🔑 Kiralama İşlemi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {isRent ? 'Aylık Kira Bedeli' : 'Satış Bedeli'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatInputDisplay(propertyPrice)}
                      placeholder="0"
                      onChange={(e) => setPropertyPrice(parseInputValue(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-black text-sm text-slate-900 pr-9"
                    />
                    <span className="absolute right-3 top-3 text-amber-600 font-bold text-xs">TL</span>
                  </div>
                </div>

              </div>
            </div>

            {/* İKİ KOLON: SATICI/KİRAYA VEREN & ALICI/KİRALAYAN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SATICI / KİRAYA VEREN */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    {sellerTitle}
                  </h2>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    {allSellerNames.length > 1 ? `${allSellerNames.length} Kişi (Eşit Pay)` : 'Tek Müşteri'}
                  </span>
                </div>

                {/* Danışman Seçimi */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Portföy Danışmanı</label>
                  <select
                    value={sellerAgentId}
                    onChange={(e) => setSellerAgentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-bold"
                  >
                    <option value="">Danışman Seçin</option>
                    {activeAgents.map(a => (
                      <option key={a.id} value={a.id}>
                        [{a.code}] {a.full_name} {a.is_partner ? '⭐ (ORTAK - %80)' : `(%${a.commission_rate})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dinamik Müşteri Listesi (Müşteri 1, Müşteri 2...) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                      {sellerTitle} Müşteri Girişi
                    </span>
                    <button
                      type="button"
                      onClick={addSellerCustomer}
                      className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-black text-amber-400 px-2.5 py-1.5 rounded-lg font-bold shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Müşteri Ekle
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {sellerCustomers.map((cust, idx) => (
                      <div key={cust.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-slate-800">Müşteri {idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateSellerCustomer(cust.id, 'mode', cust.mode === 'select' ? 'new' : 'select');
                                updateSellerCustomer(cust.id, 'name', '');
                              }}
                              className="text-[11px] text-amber-600 hover:text-amber-800 font-bold"
                            >
                              {cust.mode === 'select' ? '✏️ Yeni İsim Gir' : '📖 Rehberden Seç'}
                            </button>
                            {sellerCustomers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSellerCustomer(cust.id)}
                                className="text-red-500 hover:text-red-700 p-0.5"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {cust.mode === 'select' ? (
                          <select
                            value={cust.name}
                            onChange={(e) => updateSellerCustomer(cust.id, 'name', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-slate-50 font-bold"
                          >
                            <option value="">Rehberden Kayıtlı Müşteri Seçin</option>
                            {contacts.filter(c => c.contact_type === 'MUSTERI').map(c => (
                              <option key={c.id} value={c.full_name}>{c.full_name} {c.company ? `(${c.company})` : ''}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={`Müşteri ${idx + 1} Ad Soyad`}
                            value={cust.name}
                            onChange={(e) => updateSellerCustomer(cust.id, 'name', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-slate-50"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Komisyon */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Hizmet Bedeli / Komisyon</span>
                    {!isRent && (
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
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      {isRent ? (
                        <div className="text-xs font-bold text-slate-600 bg-white p-2 rounded-lg border">Kira / 2 (Standart)</div>
                      ) : (
                        <input
                          type="text"
                          value={sellerCommType === 'percentage' ? (sellerCommValue || '') : formatInputDisplay(sellerCommValue)}
                          placeholder="2"
                          onChange={(e) => setSellerCommValue(sellerCommType === 'percentage' ? (e.target.value === '' ? 0 : Number(e.target.value)) : parseInputValue(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold pr-8"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Komisyon Matrahı</div>
                      <div className="font-black text-slate-900 text-sm">{formatMoney(sellerBaseComm)}</div>
                    </div>
                  </div>
                </div>

                {/* Fatura Durumu (Kiralamada Kiraya Verene Fatura Kesilmez) */}
                {!isRent ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                    <span className="text-xs font-bold text-slate-800 block">Fatura Seçeneği</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSellerInvoiceType('unbilled')}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${sellerInvoiceType === 'unbilled' ? 'bg-slate-900 text-amber-500 border-slate-900' : 'bg-white text-slate-600 border-slate-300'}`}
                      >
                        Faturasız
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellerInvoiceType('full')}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${sellerInvoiceType === 'full' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-300'}`}
                      >
                        Tam Fatura
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellerInvoiceType('partial')}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${sellerInvoiceType === 'partial' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-300'}`}
                      >
                        Kısmi Fatura
                      </button>
                    </div>

                    {sellerInvoiceType !== 'unbilled' && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">KDV Hesabı:</span>
                          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setSellerInvoiceTaxIncluded(false)}
                              className={`px-2.5 py-1 rounded text-xs font-bold ${!sellerInvoiceTaxIncluded ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                            >
                              KDV Hariç (+%20)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSellerInvoiceTaxIncluded(true)}
                              className={`px-2.5 py-1 rounded text-xs font-bold ${sellerInvoiceTaxIncluded ? 'bg-amber-600 text-white' : 'text-slate-500'}`}
                            >
                              KDV Dahil (İçinden Düş)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 font-bold">
                    ℹ️ Kiralama işlemlerinde hizmet bedeli kiralayan tarafından karşılandığından, kiraya verene fatura kesilmez.
                  </div>
                )}

                {/* Harici Ortak Payı */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sellerHasPartner}
                      onChange={(e) => setSellerHasPartner(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Harici Ortak / Emlakçı Payı Düş</span>
                  </label>

                  {sellerHasPartner && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Ortak Adı"
                        value={sellerPartnerName}
                        onChange={(e) => setSellerPartnerName(e.target.value)}
                        className="p-2 rounded-lg border text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Neden"
                        value={sellerPartnerReason}
                        onChange={(e) => setSellerPartnerReason(e.target.value)}
                        className="p-2 rounded-lg border text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Pay Tutarı (TL)"
                        value={formatInputDisplay(sellerPartnerShare)}
                        onChange={(e) => setSellerPartnerShare(parseInputValue(e.target.value))}
                        className="p-2 rounded-lg border text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Giderler */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Temsilci Giderleri</span>
                    <button
                      type="button"
                      onClick={() => addExpense('seller')}
                      className="text-xs bg-slate-900 text-amber-400 px-3 py-1.5 rounded-lg font-bold"
                    >
                      + Gider Ekle
                    </button>
                  </div>
                  {sellerExpenses.map(item => (
                    <div key={item.id} className="flex gap-2 items-center bg-white p-2 rounded-lg border">
                      <input
                        type="text"
                        placeholder="Gider Açıklaması"
                        value={item.custom_description}
                        onChange={(e) => updateExpenseField('seller', item.id, 'custom_description', e.target.value)}
                        className="p-1 border rounded text-xs flex-1 font-bold"
                      />
                      <input
                        type="text"
                        placeholder="0 TL"
                        value={formatInputDisplay(item.amount)}
                        onChange={(e) => updateExpenseField('seller', item.id, 'amount', parseInputValue(e.target.value))}
                        className="p-1 border rounded text-xs w-24 font-bold"
                      />
                      <button type="button" onClick={() => removeExpense('seller', item.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Hak Ediş Özeti (Kurumsal Pay Vurgulu) */}
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Brüt Danışman Marjı (%{sellerAgentAppliedRate}):</span>
                    <b className="text-slate-900">{formatMoney(sellerAgentGross)}</b>
                  </div>
                  {isSellerPartner && (
                    <div className="flex justify-between text-amber-900 font-bold bg-amber-100/80 p-1.5 rounded-lg">
                      <span>Kurumsal Pay / Şirket Sermayesi (%10 Kesinti):</span>
                      <b>- {formatMoney(sellerCorporateShare)}</b>
                    </div>
                  )}
                  {sellerTaxDeduction > 0 && (
                    <div className="flex justify-between text-slate-600 font-bold">
                      <span>Fatura Gelir Vergisi Kesintisi (%25):</span>
                      <b>- {formatMoney(sellerTaxDeduction)}</b>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-amber-200">
                    <span>Temsilci NET Ödenecek:</span>
                    <span className="text-amber-700">{formatMoney(sellerAgentNet)}</span>
                  </div>
                </div>
              </div>

              {/* ALICI / KİRALAYAN */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    {buyerTitle}
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {allBuyerNames.length > 1 ? `${allBuyerNames.length} Kişi (Eşit Pay)` : 'Tek Müşteri'}
                  </span>
                </div>

                {/* Danışman Seçimi */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Danışmanı</label>
                  <select
                    value={buyerAgentId}
                    onChange={(e) => setBuyerAgentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-bold"
                  >
                    <option value="">Danışman Seçin</option>
                    {activeAgents.map(a => (
                      <option key={a.id} value={a.id}>
                        [{a.code}] {a.full_name} {a.is_partner ? '⭐ (ORTAK - %80)' : `(%${a.commission_rate})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dinamik Müşteri Listesi (Müşteri 1, Müşteri 2...) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {buyerTitle} Müşteri Girişi
                    </span>
                    <button
                      type="button"
                      onClick={addBuyerCustomer}
                      className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-black text-emerald-400 px-2.5 py-1.5 rounded-lg font-bold shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Müşteri Ekle
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {buyerCustomers.map((cust, idx) => (
                      <div key={cust.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-slate-800">Müşteri {idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateBuyerCustomer(cust.id, 'mode', cust.mode === 'select' ? 'new' : 'select');
                                updateBuyerCustomer(cust.id, 'name', '');
                              }}
                              className="text-[11px] text-emerald-600 hover:text-emerald-800 font-bold"
                            >
                              {cust.mode === 'select' ? '✏️ Yeni İsim Gir' : '📖 Rehberden Seç'}
                            </button>
                            {buyerCustomers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBuyerCustomer(cust.id)}
                                className="text-red-500 hover:text-red-700 p-0.5"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {cust.mode === 'select' ? (
                          <select
                            value={cust.name}
                            onChange={(e) => updateBuyerCustomer(cust.id, 'name', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-slate-50 font-bold"
                          >
                            <option value="">Rehberden Kayıtlı Müşteri Seçin</option>
                            {contacts.filter(c => c.contact_type === 'MUSTERI').map(c => (
                              <option key={c.id} value={c.full_name}>{c.full_name} {c.company ? `(${c.company})` : ''}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={`Müşteri ${idx + 1} Ad Soyad`}
                            value={cust.name}
                            onChange={(e) => updateBuyerCustomer(cust.id, 'name', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold bg-slate-50"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Komisyon */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Hizmet Bedeli / Komisyon</span>
                    {!isRent && (
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
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      {isRent ? (
                        <div className="text-xs font-bold text-slate-600 bg-white p-2 rounded-lg border">Kira / 2 (Standart)</div>
                      ) : (
                        <input
                          type="text"
                          value={buyerCommType === 'percentage' ? (buyerCommValue || '') : formatInputDisplay(buyerCommValue)}
                          placeholder="2"
                          onChange={(e) => setBuyerCommValue(buyerCommType === 'percentage' ? (e.target.value === '' ? 0 : Number(e.target.value)) : parseInputValue(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold pr-8"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Komisyon Matrahı</div>
                      <div className="font-black text-slate-900 text-sm">{formatMoney(buyerBaseComm)}</div>
                    </div>
                  </div>
                </div>

                {/* Fatura Durumu (Kiralamada Tam Fatura = 1 Tam Kira) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Fatura Seçeneği</span>
                    {isRent && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Tam Fatura = 1 Kira ({formatMoney(propertyPrice)})</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBuyerInvoiceType('unbilled')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${buyerInvoiceType === 'unbilled' ? 'bg-slate-900 text-amber-500 border-slate-900' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Faturasız
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyerInvoiceType('full')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${buyerInvoiceType === 'full' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Tam Fatura
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyerInvoiceType('partial')}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${buyerInvoiceType === 'partial' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300'}`}
                    >
                      Kısmi Fatura
                    </button>
                  </div>

                  {buyerInvoiceType !== 'unbilled' && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">KDV Hesabı:</span>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setBuyerInvoiceTaxIncluded(false)}
                            className={`px-2.5 py-1 rounded text-xs font-bold ${!buyerInvoiceTaxIncluded ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                          >
                            KDV Hariç (+%20)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuyerInvoiceTaxIncluded(true)}
                            className={`px-2.5 py-1 rounded text-xs font-bold ${buyerInvoiceTaxIncluded ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
                          >
                            KDV Dahil (İçinden Düş)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Harici Ortak Payı */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={buyerHasPartner}
                      onChange={(e) => setBuyerHasPartner(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Harici Ortak / Emlakçı Payı Düş</span>
                  </label>

                  {buyerHasPartner && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Ortak Adı"
                        value={buyerPartnerName}
                        onChange={(e) => setBuyerPartnerName(e.target.value)}
                        className="p-2 rounded-lg border text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Neden"
                        value={buyerPartnerReason}
                        onChange={(e) => setBuyerPartnerReason(e.target.value)}
                        className="p-2 rounded-lg border text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Pay Tutarı (TL)"
                        value={formatInputDisplay(buyerPartnerShare)}
                        onChange={(e) => setBuyerPartnerShare(parseInputValue(e.target.value))}
                        className="p-2 rounded-lg border text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Giderler */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Temsilci Giderleri</span>
                    <button
                      type="button"
                      onClick={() => addExpense('buyer')}
                      className="text-xs bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-lg font-bold"
                    >
                      + Gider Ekle
                    </button>
                  </div>
                  {buyerExpenses.map(item => (
                    <div key={item.id} className="flex gap-2 items-center bg-white p-2 rounded-lg border">
                      <input
                        type="text"
                        placeholder="Gider Açıklaması"
                        value={item.custom_description}
                        onChange={(e) => updateExpenseField('buyer', item.id, 'custom_description', e.target.value)}
                        className="p-1 border rounded text-xs flex-1 font-bold"
                      />
                      <input
                        type="text"
                        placeholder="0 TL"
                        value={formatInputDisplay(item.amount)}
                        onChange={(e) => updateExpenseField('buyer', item.id, 'amount', parseInputValue(e.target.value))}
                        className="p-1 border rounded text-xs w-24 font-bold"
                      />
                      <button type="button" onClick={() => removeExpense('buyer', item.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Hak Ediş Özeti */}
                <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Brüt Danışman Marjı (%{buyerAgentAppliedRate}):</span>
                    <b className="text-slate-900">{formatMoney(buyerAgentGross)}</b>
                  </div>
                  {isBuyerPartner && (
                    <div className="flex justify-between text-emerald-900 font-bold bg-emerald-100/80 p-1.5 rounded-lg">
                      <span>Kurumsal Pay / Şirket Sermayesi (%10 Kesinti):</span>
                      <b>- {formatMoney(buyerCorporateShare)}</b>
                    </div>
                  )}
                  {buyerTaxDeduction > 0 && (
                    <div className="flex justify-between text-slate-600 font-bold">
                      <span>Fatura Gelir Vergisi Kesintisi (%25):</span>
                      <b>- {formatMoney(buyerTaxDeduction)}</b>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-emerald-200">
                    <span>Temsilci NET Ödenecek:</span>
                    <span className="text-emerald-700">{formatMoney(buyerAgentNet)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 1 SAYFA A4 BORDRONUN RENDER ALANI */}
            <div ref={pdfRef} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 print:p-0 print:border-none">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b-2 border-slate-900 pb-3 gap-2">
                <div>
                  <span className="text-xs font-black tracking-widest text-amber-600 uppercase">360 IC - INVESTOR COMMUNITY</span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">İŞLEM VE HAK EDİŞ BORDROSU</h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold mt-1">
                    <span>İşlem Kodu: <b className="text-slate-900">{savedTransactionCode || '360IC-TASLAK'}</b></span>
                    <span>•</span>
                    <span>Taşınmaz No: <b className="text-slate-900">{manualPropertyNo || 'Belirtilmedi'}</b> ({manualPropertyTitle || '-'})</span>
                    <span>•</span>
                    <span>Tarih: {new Date(transactionDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                <div className="sm:text-right bg-slate-900 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">{transactionType} İŞLEM BEDELİ</span>
                  <p className="text-xl font-black text-white">{formatMoney(propertyPrice)}</p>
                </div>
              </div>

              {/* Taraf Dökümleri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-1.5 flex justify-between">
                    <span className="text-amber-600 font-black">{sellerTitle}</span>
                    <span className="font-bold text-slate-500">Temsilci: {selectedSellerAgent ? `[${selectedSellerAgent.code}] ${selectedSellerAgent.full_name}` : 'Atanmadı'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Müşteri(ler):</span>
                    <b className="text-slate-800">{allSellerNames.join(', ') || '-'}</b>
                  </div>
                  <div className="flex justify-between"><span>Komisyon Matrahı:</span><b className="text-slate-800">{formatMoney(sellerBaseComm)}</b></div>
                  <div className="flex justify-between"><span>Fatura KDV:</span><b className="text-slate-800">{formatMoney(sellerTaxAmount)}</b></div>
                  {isSellerPartner && (
                    <div className="flex justify-between text-amber-900 font-bold"><span>Kurumsal Pay (%10 Şirket Sermayesi):</span><b>- {formatMoney(sellerCorporateShare)}</b></div>
                  )}
                  {sellerTaxDeduction > 0 && (
                    <div className="flex justify-between text-slate-600 font-bold"><span>Gelir Vergisi Kesintisi (%25):</span><b>- {formatMoney(sellerTaxDeduction)}</b></div>
                  )}
                  <div className="flex justify-between text-amber-700 font-black pt-1.5 mt-1 border-t border-slate-200 text-sm">
                    <span>Temsilci Net Hak Ediş:</span>
                    <span>{formatMoney(sellerAgentNet)}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-1.5 flex justify-between">
                    <span className="text-emerald-600 font-black">{buyerTitle}</span>
                    <span className="font-bold text-slate-500">Temsilci: {selectedBuyerAgent ? `[${selectedBuyerAgent.code}] ${selectedBuyerAgent.full_name}` : 'Atanmadı'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Müşteri(ler):</span>
                    <b className="text-slate-800">{allBuyerNames.join(', ') || '-'}</b>
                  </div>
                  <div className="flex justify-between"><span>Komisyon Matrahı:</span><b className="text-slate-800">{formatMoney(buyerBaseComm)}</b></div>
                  <div className="flex justify-between"><span>Fatura KDV:</span><b className="text-slate-800">{formatMoney(buyerTaxAmount)}</b></div>
                  {isBuyerPartner && (
                    <div className="flex justify-between text-emerald-900 font-bold"><span>Kurumsal Pay (%10 Şirket Sermayesi):</span><b>- {formatMoney(buyerCorporateShare)}</b></div>
                  )}
                  {buyerTaxDeduction > 0 && (
                    <div className="flex justify-between text-slate-600 font-bold"><span>Gelir Vergisi Kesintisi (%25):</span><b>- {formatMoney(buyerTaxDeduction)}</b></div>
                  )}
                  <div className="flex justify-between text-emerald-700 font-black pt-1.5 mt-1 border-t border-slate-200 text-sm">
                    <span>Temsilci Net Hak Ediş:</span>
                    <span>{formatMoney(buyerAgentNet)}</span>
                  </div>
                </div>
              </div>

              {/* Genel Mali Tablo */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-amber-500 p-2.5 font-black text-xs uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Mali Hesap Özeti & Kasa Dağılımı
                </div>

                <div className="p-4 space-y-4 bg-white">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs uppercase tracking-wider mb-1.5">
                      <TrendingUp className="w-4 h-4" /> Brüt Kasa Girişi (Tahsil Edilen)
                    </div>
                    <div className="bg-emerald-50/50 rounded-lg p-2.5 space-y-1 text-xs border border-emerald-100 font-bold">
                      <div className="flex justify-between text-slate-700">
                        <span>TOPLAM TAHSILEDILEN BRÜT KOMİSYON + KDV:</span>
                        <span className="text-emerald-700 text-sm">{formatMoney(totalGrossCollection)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-red-700 font-black text-xs uppercase tracking-wider mb-1.5">
                      <TrendingDown className="w-4 h-4" /> Kasa Çıkışları & Ayrılan Fonlar
                    </div>
                    <div className="bg-red-50/50 rounded-lg p-2.5 space-y-1 text-xs border border-red-100 font-bold">
                      <div className="flex justify-between text-slate-700">
                        <span>Temsilcilere Ödenecek Net Hak Ediş:</span>
                        <span className="text-red-600">- {formatMoney(totalAgentEarnings)}</span>
                      </div>
                      {totalCorporateShares > 0 && (
                        <div className="flex justify-between text-amber-900 bg-amber-100/60 p-1 rounded">
                          <span>Ortaklar Şirket Sermaye Payı (Kasada Kalır):</span>
                          <span>+{formatMoney(totalCorporateShares)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-700">
                        <span>KDV + Vergi Kesintileri:</span>
                        <span className="text-red-600">- {formatMoney(totalTaxAmount + totalTaxDeductions)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Harici Ortak & Masraflar:</span>
                        <span className="text-red-600">- {formatMoney(totalPartnerShares + totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-4 flex justify-between items-center shadow">
                    <div>
                      <span className="text-xs text-amber-500 font-black uppercase tracking-wider block">360 IC - ŞİRKET NET KAZANCI</span>
                      <p className="text-[10px] text-slate-400 font-medium">Ofis payı ve ortak sermaye fonları dahil net şirket geliri</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-white">{formatMoney(totalOfficeNetIncome)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SEKME: MÜLK PORTFÖYÜ & YAŞAM DÖNGÜSÜ */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Home className="w-5 h-5 text-emerald-600" />
                    Taşınmaz / Gayrimenkul Portföyü ({properties.length})
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Taşınmaz numarası ile mülklerinizi sisteme kaydedin, sahiplik devirlerini ve işlem geçmişini takip edin.</p>
                </div>
                <input
                  type="text"
                  placeholder="Taşınmaz no veya isim ara..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="p-2 border border-slate-300 rounded-xl text-xs font-semibold w-64"
                />
              </div>

              {/* Yeni Mülk Kayıt Formu */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">🏢 Yeni Taşınmaz Tanımla</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Taşınmaz No (Örn: 1252023525)"
                    value={newPropNo}
                    onChange={(e) => setNewPropNo(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Etiket İsmi (Örn: Rota Blok B 30 Bursa)"
                    value={newPropTitle}
                    onChange={(e) => setNewPropTitle(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Mülk Sahibi Adı (Ahmet Bey)"
                    value={newPropOwners[0] || ''}
                    onChange={(e) => setNewPropOwners([e.target.value])}
                    className="p-2.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCreateProperty}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
                  >
                    + Taşınmazı Portföye Kaydet
                  </button>
                </div>
              </div>

              {/* Mülk Listesi */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.filter(p => 
                  p.property_number.includes(propertySearchQuery) || 
                  p.title.toLowerCase().includes(propertySearchQuery.toLowerCase())
                ).map(p => (
                  <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">No: {p.property_number}</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{p.title}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingProperty(p)} className="p-1.5 bg-white text-slate-600 rounded-lg border shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteProperty(p.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-slate-600">
                        <span className="font-bold text-slate-700">Güncel Sahip(ler): </span>
                        <span className="font-black text-emerald-700">{p.owner_names?.join(', ') || 'Belirtilmedi'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPropertyFilter(p.property_number);
                        setAnalyticsSubView('portfolio');
                        setActiveTab('analytics');
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-black text-amber-400 rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5" /> Yaşam Döngüsü & Tarihçesini Gör
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SEKME: RAPORLAR, GRAFİKLER & PORTFÖY ANALİZİ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Alt Görünüm Seçici (Genel Finans vs Mülk/Müşteri Portföyü) */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setAnalyticsSubView('general')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition ${analyticsSubView === 'general' ? 'bg-slate-900 text-amber-400 shadow' : 'text-slate-600'}`}
                >
                  📊 Genel Finans & Danışman Performansı
                </button>
                <button
                  onClick={() => setAnalyticsSubView('portfolio')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition ${analyticsSubView === 'portfolio' ? 'bg-slate-900 text-amber-400 shadow' : 'text-slate-600'}`}
                >
                  🏢 Mülk Yaşam Döngüsü & Müşteri Analizi
                </button>
              </div>

              {analyticsSubView === 'portfolio' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">İncelenecek Taşınmaz:</span>
                  <select
                    value={selectedPropertyFilter}
                    onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                    className="p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="">Taşınmaz Seçin</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.property_number}>[{p.property_number}] {p.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {analyticsSubView === 'general' ? (
              <>
                {/* Filtre Barı */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-900 text-amber-500 rounded-xl">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ofis / Şube</label>
                        <select
                          value={selectedOfficeFilter}
                          onChange={(e) => setSelectedOfficeFilter(e.target.value)}
                          className="p-1 pl-0 bg-transparent font-black text-xs text-slate-900 border-b border-slate-300 focus:outline-none"
                        >
                          <option value="all">🏢 TÜM OFİSLER</option>
                          {officeList.map(off => <option key={off} value={off}>{off}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-900 text-amber-500 rounded-xl">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Danışman</label>
                        <select
                          value={selectedAgentFilter}
                          onChange={(e) => setSelectedAgentFilter(e.target.value)}
                          className="p-1 pl-0 bg-transparent font-black text-xs text-slate-900 border-b border-slate-300 focus:outline-none"
                        >
                          <option value="all">🌟 TÜM DANIŞMANLAR</option>
                          {agents.map(a => <option key={a.id} value={a.id}>[{a.code}] {a.full_name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setDateFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${dateFilter === 'all' ? 'bg-slate-900 text-amber-500' : 'bg-white'}`}>Tüm Zamanlar</button>
                    <button onClick={() => setDateFilter('this_month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${dateFilter === 'this_month' ? 'bg-slate-900 text-amber-500' : 'bg-white'}`}>Bu Ay</button>
                    <button onClick={() => setDateFilter('this_year')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${dateFilter === 'this_year' ? 'bg-slate-900 text-amber-500' : 'bg-white'}`}>Bu Yıl</button>
                  </div>
                </div>

                {/* KPI Kartları (Mülk Adedi vs Taraf Bacağı Vurgulu) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mülk & Taraf İşlem Sayısı</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-slate-900">{analyticsSummary.totalMulkTransactions}</span>
                      <span className="text-xs font-bold text-slate-500">Mülk İşlemi</span>
                    </div>
                    <span className="text-[11px] text-amber-600 font-bold block mt-1">
                      ({analyticsSummary.totalTarafTransactions} Taraf / Danışman Bacağı)
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Toplam Brüt Kasa Hacmi</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{formatMoney(analyticsSummary.totalGrossVolume)}</div>
                    <span className="text-[11px] text-slate-400 font-medium mt-1 block">Komisyon + KDV Toplamı</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Portföydeki Taşınmazlar</span>
                    <div className="text-3xl font-black text-slate-900 mt-1">{properties.length}</div>
                    <span className="text-[11px] text-slate-400 font-medium mt-1 block">Kayıtlı ve döngüde olan mülk</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">360 IC Şirket Net Kazancı</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">{formatMoney(analyticsSummary.totalOfficeNet)}</div>
                    <span className="text-[11px] text-emerald-700 font-bold mt-1 block">Ofis net payı</span>
                  </div>
                </div>

                {/* İlk 3 Danışman Çizgi Grafikleri (Yılbaşından İtibaren) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      İşlem Sayısı Bazında İlk 3 Danışman (Yılbaşından İtibaren)
                    </h3>
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsSummary.top3CountTimeline}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                          <YAxis fontSize={11} stroke="#94a3b8" />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          {analyticsSummary.top3CountAgents.map((ag, i) => (
                            <Line key={ag.id} type="monotone" dataKey={ag.name} stroke={TOP3_COLORS[i % TOP3_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-2">
                      <Award className="w-4 h-4 text-blue-500" />
                      Ciro / Komisyon Bazında İlk 3 Danışman (Yılbaşından İtibaren)
                    </h3>
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsSummary.top3GrossTimeline}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                          <YAxis fontSize={10} stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                          <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          {analyticsSummary.top3GrossAgents.map((ag, i) => (
                            <Line key={ag.id} type="monotone" dataKey={ag.name} stroke={TOP3_COLORS[i % TOP3_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* ORTAKLAR ŞİRKET SERMAYESİ TAKİP ALANI (Açılır/Kapanır Accordion) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setIsCapitalAccordionOpen(!isCapitalAccordionOpen)}
                    className="w-full p-5 bg-slate-900 text-white flex justify-between items-center hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-amber-400" />
                      <div className="text-left">
                        <span className="font-black text-sm block">Ortaklar Şirket Sermayesi Fonu Takibi ({partnerCapitalStats.currentYear})</span>
                        <span className="text-[11px] text-slate-400">Ortak danışmanların %10 marj kesintileriyle şirkette bıraktığı sermaye payları</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-400 font-black text-base">{formatMoney(partnerCapitalStats.grandTotalCapital)}</span>
                      {isCapitalAccordionOpen ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5 text-amber-400" />}
                    </div>
                  </button>

                  {isCapitalAccordionOpen && (
                    <div className="p-6 bg-slate-50 space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {partnerCapitalStats.partnerList.map(pt => (
                          <div key={pt.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-xs font-bold text-slate-500">[{pt.code}] {pt.name}</span>
                            <div className="text-xl font-black text-slate-900">{formatMoney(pt.totalCorporateCapital)}</div>
                            <span className="text-[10px] text-amber-600 font-bold uppercase">{pt.office} • Cari Yıl Katkısı</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                        <span className="font-black text-slate-800 text-sm">ORTAKLAR TOPLAM ŞİRKET SERMAYE KATKISI (ALT YEKÜN):</span>
                        <span className="text-xl font-black text-amber-900">{formatMoney(partnerCapitalStats.grandTotalCapital)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* MÜLK YAŞAM DÖNGÜSÜ & MÜŞTERİ ZAMAN TÜNELİ GÖRÜNÜMÜ */
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                {selectedPropertyObj ? (
                  <div className="space-y-6">
                    <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">TAŞINMAZ YAŞAM DÖNGÜSÜ</span>
                        <h3 className="text-xl font-black mt-1">[{selectedPropertyObj.property_number}] {selectedPropertyObj.title}</h3>
                        <p className="text-xs text-slate-300 font-semibold mt-1">Güncel Mülk Sahibi(leri): <b className="text-emerald-400">{selectedPropertyObj.owner_names?.join(', ') || 'Belirtilmedi'}</b></p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-bold">Toplam Geçmiş İşlem</span>
                        <span className="text-2xl font-black text-amber-400">{selectedPropertyHistory.length} Adet</span>
                      </div>
                    </div>

                    {/* Zaman Çizelgesi (Timeline) */}
                    <div className="relative border-l-2 border-slate-300 pl-6 space-y-6 my-4 ml-4">
                      {selectedPropertyHistory.map((h, i) => (
                        <div key={h.id} className="relative group">
                          <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ${h.transaction_type === 'SATIŞ' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-slate-900">{new Date(h.created_at).toLocaleDateString('tr-TR')} • {h.transaction_code}</span>
                              <span className={`px-2 py-0.5 rounded font-black text-[10px] ${h.transaction_type === 'SATIŞ' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {h.transaction_type}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between text-xs gap-2 pt-1 border-t">
                              <div>
                                <span className="text-slate-500 font-bold block">{h.transaction_type === 'SATIŞ' ? 'Eski Sahip (Satıcı):' : 'Kiraya Veren:'}</span>
                                <span className="font-bold text-slate-900">{h.seller_parties?.join(', ') || h.seller_name}</span>
                              </div>
                              <div className="flex items-center text-slate-400 font-black">➔</div>
                              <div>
                                <span className="text-slate-500 font-bold block">{h.transaction_type === 'SATIŞ' ? 'Yeni Sahip (Alıcı):' : 'Kiralayan / Kiracı:'}</span>
                                <span className="font-bold text-emerald-700">{h.buyer_parties?.join(', ') || h.buyer_name}</span>
                              </div>
                              <div className="sm:text-right">
                                <span className="text-slate-500 font-bold block">İşlem Bedeli:</span>
                                <span className="font-black text-slate-900">{formatMoney(Number(h.property_price))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold">
                    Lütfen yaşam döngüsünü incelemek için yukarıdan bir taşınmaz seçin.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 4. SEKME: KİŞİ REHBERİ */}
        {activeTab === 'contacts' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Contact2 className="w-5 h-5 text-amber-600" />
                  Müşteri, Danışan & Ortak Rehberi ({contacts.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">Müşterilerinizi ve gayrimenkul sahiplerini buradan bağımsız olarak kaydedebilirsiniz.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kişi veya firma ara..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="p-2 border border-slate-300 rounded-xl text-xs font-semibold w-56"
                />
                <button
                  onClick={() => setEditingContact({ id: '', full_name: '', contact_type: 'MUSTERI', phone: '', email: '', company: '', notes: '' })}
                  className="bg-slate-900 hover:bg-black text-amber-400 px-3 py-2 rounded-xl text-xs font-bold shadow"
                >
                  + Yeni Kişi Ekle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.filter(c => c.full_name.toLowerCase().includes(contactSearchQuery.toLowerCase())).map(c => (
                <div key={c.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 relative group hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{c.full_name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${c.contact_type === 'MUSTERI' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {c.contact_type === 'MUSTERI' ? 'Müşteri / Danışan' : 'Harici Ortak'}
                      </span>
                    </div>
                    <button onClick={() => setEditingContact(c)} className="p-1.5 bg-white rounded-lg border shadow-sm"><Edit3 className="w-3.5 h-3.5 text-slate-600" /></button>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    {c.company && <div>🏢 {c.company}</div>}
                    {c.phone && <div>📞 {c.phone}</div>}
                    {c.email && <div>✉️ {c.email}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SEKME: İŞLEM ARŞİVİ */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-600" />
                  İşlem Arşivi ({transactionsHistory.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">Benzersiz işlem numaralarıyla tüm geçmiş kayıtlar.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-amber-500 font-black border-b border-slate-700">
                    <th className="p-3.5 rounded-tl-lg">İşlem Kodu</th>
                    <th className="p-3.5">Tarih</th>
                    <th className="p-3.5">Tür</th>
                    <th className="p-3.5">Taşınmaz No & İsim</th>
                    <th className="p-3.5">Satıcı / Kiraya Veren</th>
                    <th className="p-3.5">Alıcı / Kiracı</th>
                    <th className="p-3.5 text-right">İşlem Bedeli</th>
                    <th className="p-3.5 text-right">360 IC Şirket Payı</th>
                    <th className="p-3.5 text-right rounded-tr-lg">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-slate-50">
                  {transactionsHistory.map(row => (
                    <tr key={row.id} onClick={() => openHistoryDetail(row)} className="hover:bg-amber-50/60 cursor-pointer transition">
                      <td className="p-3.5 font-black text-slate-900">{row.transaction_code || '-'}</td>
                      <td className="p-3.5 text-slate-600 font-bold">{new Date(row.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 bg-slate-200 text-slate-900 font-black rounded">{row.transaction_type}</span></td>
                      <td className="p-3.5 font-bold text-slate-800">[{row.property_number || '-'}] {row.property_title || ''}</td>
                      <td className="p-3.5 font-bold text-slate-900">{row.seller_parties?.length ? row.seller_parties.join(', ') : row.seller_name}</td>
                      <td className="p-3.5 font-bold text-slate-900">{row.buyer_parties?.length ? row.buyer_parties.join(', ') : row.buyer_name}</td>
                      <td className="p-3.5 text-right font-black text-slate-700">{formatMoney(Number(row.property_price))}</td>
                      <td className="p-3.5 text-right font-black text-emerald-600 text-sm">{formatMoney(Number(row.total_office_net_income))}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); openHistoryDetail(row); }} className="p-1.5 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(row.id); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. SEKME: HEDEF BELİRLE & TAKİP */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500 space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" /> Danışman Hedef & Prim Takibi
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Hedefleri belirleyin; sistem tamamlanan adetlere göre hak edişleri otomatik döksün.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">🎯 Yeni Hedef Ata</span>
                    {targetTemplates.length > 0 && (
                      <select value={selectedTemplateId} onChange={(e) => handleSelectTemplate(e.target.value)} className="p-1 border rounded text-xs font-bold bg-white">
                        <option value="">Hazır Paket Şablonu Seç</option>
                        {targetTemplates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.title}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hedef Başlığı</label>
                      <input type="text" placeholder="Örn: 2026 Q3 Satış Deparı" value={targetTitle} onChange={(e) => setTargetTitle(e.target.value)} className="w-full p-2.5 rounded-lg border font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hedef Danışman</label>
                      <select value={targetAgentId} onChange={(e) => setTargetAgentId(e.target.value)} className="w-full p-2.5 rounded-lg border font-bold">
                        <option value="">Seçin</option>
                        {activeAgents.map(a => <option key={a.id} value={a.id}>[{a.code}] {a.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tür</label>
                      <select value={targetType} onChange={(e) => setTargetType(e.target.value as any)} className="w-full p-2.5 rounded-lg border font-bold">
                        <option value="SATIŞ">Satış</option>
                        <option value="KİRALAMA">Kiralama</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hedef Adedi</label>
                      <input type="number" value={targetCount || ''} onChange={(e) => setTargetCount(Number(e.target.value))} className="w-full p-2 rounded-lg border font-bold" />
                    </div>
                  </div>

                  <button onClick={handleAssignTarget} className="w-full py-2.5 bg-slate-900 text-amber-400 rounded-xl font-black text-xs shadow flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" /> Hedefi Danışmana Tanımla
                  </button>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">📦 Hazır Şablon Tanımla</span>
                  <input type="text" placeholder="Şablon Adı" value={newTplTitle} onChange={(e) => setNewTplTitle(e.target.value)} className="w-full p-2 rounded-lg border text-xs font-bold" />
                  <div className="flex gap-2 text-xs">
                    <select value={newTplType} onChange={(e) => setNewTplType(e.target.value as any)} className="p-2 border rounded font-bold w-1/2">
                      <option value="SATIŞ">Satış</option>
                      <option value="KİRALAMA">Kira</option>
                    </select>
                    <input type="number" placeholder="Adet" value={newTplCount || ''} onChange={(e) => setNewTplCount(Number(e.target.value))} className="p-2 border rounded font-bold w-1/2" />
                  </div>
                  <button onClick={handleSaveTemplate} className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold text-xs shadow">
                    + Şablonu Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. SEKME: SİSTEM TANIMLARI (Ortak Bayraklı Danışman Yönetimi) */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base font-black text-slate-900">Temsilci Kadrosu & Ortaklık</h2>
                </div>
                <span className="text-xs font-bold text-slate-500">{agents.length} Danışman</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Yeni Temsilci Tanımla</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Kod (363)" value={newAgentCode} onChange={(e) => setNewAgentCode(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                  <input type="text" placeholder="Ad Soyad" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Ofis / Şube (Nilüfer vb.)" value={newAgentOffice} onChange={(e) => setNewAgentOffice(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer select-none">
                    <input type="checkbox" checked={newAgentIsPartner} onChange={(e) => setNewAgentIsPartner(e.target.checked)} className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800">Şirket Ortağı (%80)</span>
                  </label>
                </div>
                {!newAgentIsPartner && (
                  <input type="number" placeholder="Hak Ediş Oranı (%50)" value={newAgentRate || ''} onChange={(e) => setNewAgentRate(Number(e.target.value))} className="w-full p-2 border rounded-lg text-xs font-bold" />
                )}
                <button onClick={handleAddAgent} className="w-full bg-slate-900 text-amber-400 py-2.5 rounded-lg text-xs font-black shadow">
                  + Temsilciyi Kaydet
                </button>
              </div>

              <div className="space-y-2">
                {agents.map(a => (
                  <div key={a.id} className="flex justify-between items-center p-3 rounded-xl border bg-slate-50 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-600">[{a.code}]</span>
                        <span className="font-bold text-slate-900">{a.full_name}</span>
                        {a.is_partner && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-black rounded text-[10px]">ORTAK (%80)</span>}
                      </div>
                      <span className="text-[11px] text-slate-500 block">🏢 {a.office_name || 'Merkez'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAgentActiveStatus(a)} className="px-2 py-1 bg-slate-200 rounded font-bold text-[11px]">
                        {a.is_active !== false ? 'Aktif' : 'Pasif'}
                      </button>
                      <button onClick={() => setEditingAgent(a)} className="p-1.5 bg-white border rounded shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteAgent(a.id)} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-base font-black text-slate-900">Standart Gider Kalemleri</h2>
                <span className="text-xs font-bold text-slate-500">{expenseTypes.length} Kalem</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Gider Adı" value={newExpName} onChange={(e) => setNewExpName(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                  <input type="text" placeholder="Varsayılan Tutar" value={formatInputDisplay(newExpCost)} onChange={(e) => setNewExpCost(parseInputValue(e.target.value))} className="p-2 border rounded-lg text-xs font-bold" />
                </div>
                <button onClick={handleAddExpenseType} className="w-full bg-amber-600 text-white py-2.5 rounded-lg text-xs font-black shadow">
                  + Gider Kalemini Kaydet
                </button>
              </div>

              <div className="space-y-2">
                {expenseTypes.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border text-xs">
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded font-black">{formatMoney(t.default_cost)}</span>
                      <button onClick={() => setEditingExpenseType(t)} className="p-1.5 bg-white border rounded shadow-sm"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteExpenseType(t.id)} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DETAY & GÜNCELLEME MODALI */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-base font-black">İşlem Detay Bordrosu ({selectedHistoryItem.transaction_code})</h3>
                    <p className="text-xs text-slate-400">Taşınmaz No: {selectedHistoryItem.property_number || '-'} • {new Date(selectedHistoryItem.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadPDFFromRef(modalPdfRef)} className="bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> PDF İndir
                  </button>
                  <button onClick={() => setSelectedHistoryItem(null)} className="p-1.5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
                <div ref={modalPdfRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                  <div className="flex justify-between items-end border-b-2 border-slate-900 pb-3">
                    <div>
                      <span className="text-xs font-black text-amber-600 uppercase">360 IC BORDRO DETAYI</span>
                      <h4 className="text-xl font-black text-slate-900">{selectedHistoryItem.transaction_code}</h4>
                      <p className="text-xs text-slate-500 font-bold">Mülk: [{selectedHistoryItem.property_number}] {selectedHistoryItem.property_title}</p>
                    </div>
                    <div className="text-right bg-slate-900 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">{selectedHistoryItem.transaction_type} BEDELİ</span>
                      <span className="text-lg font-black text-white">{formatMoney(Number(selectedHistoryItem.property_price))}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border space-y-1.5">
                      <div className="font-black border-b pb-1 text-amber-700">Satıcı / Kiraya Veren Tarafı</div>
                      <div className="flex justify-between"><span>Müşteriler:</span><b>{selectedHistoryItem.seller_parties?.join(', ') || selectedHistoryItem.seller_name}</b></div>
                      <div className="flex justify-between"><span>Komisyon Matrahı:</span><b>{formatMoney(Number(selectedHistoryItem.seller_base_commission))}</b></div>
                      {Number(selectedHistoryItem.seller_corporate_share) > 0 && (
                        <div className="flex justify-between text-amber-900 font-bold"><span>Kurumsal Pay (%10 Sermaye):</span><b>- {formatMoney(Number(selectedHistoryItem.seller_corporate_share))}</b></div>
                      )}
                      <div className="flex justify-between text-amber-700 font-black pt-1 border-t"><span>Danışman Net:</span><b>{formatMoney(Number(selectedHistoryItem.seller_agent_net_earning))}</b></div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border space-y-1.5">
                      <div className="font-black border-b pb-1 text-emerald-700">Alıcı / Kiralayan Tarafı</div>
                      <div className="flex justify-between"><span>Müşteriler:</span><b>{selectedHistoryItem.buyer_parties?.join(', ') || selectedHistoryItem.buyer_name}</b></div>
                      <div className="flex justify-between"><span>Komisyon Matrahı:</span><b>{formatMoney(Number(selectedHistoryItem.buyer_base_commission))}</b></div>
                      {Number(selectedHistoryItem.buyer_corporate_share) > 0 && (
                        <div className="flex justify-between text-emerald-900 font-bold"><span>Kurumsal Pay (%10 Sermaye):</span><b>- {formatMoney(Number(selectedHistoryItem.buyer_corporate_share))}</b></div>
                      )}
                      <div className="flex justify-between text-emerald-700 font-black pt-1 border-t"><span>Danışman Net:</span><b>{formatMoney(Number(selectedHistoryItem.buyer_agent_net_earning))}</b></div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                    <span className="font-black text-amber-400 text-xs uppercase tracking-wider">ŞİRKET NET KAZANCI:</span>
                    <span className="text-xl font-black text-emerald-400">{formatMoney(Number(selectedHistoryItem.total_office_net_income))}</span>
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