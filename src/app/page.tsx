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
  Briefcase,
  Home,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserPlus,
  AlertCircle
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
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'this_year'>('all');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('');

  // Düzenleme Modalları
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

  // MÜLK PORTFÖYÜ: Yeni Mülk Kayıt Formu (Dinamik Sahip Listesi)
  const [newPropNo, setNewPropNo] = useState('');
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropOwnersList, setNewPropOwnersList] = useState<CustomerEntry[]>([
    { id: '1', mode: 'select', name: '' }
  ]);
  const [newPropCity, setNewPropCity] = useState('Bursa');
  const [newPropNotes, setNewPropNotes] = useState('');

  // Hızlı Sahip Atama Modalı (Kırmızı + Butonu İçin)
  const [assigningProperty, setAssigningProperty] = useState<Property | null>(null);
  const [quickAssignOwners, setQuickAssignOwners] = useState<CustomerEntry[]>([
    { id: '1', mode: 'select', name: '' }
  ]);

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
      setAuthError('Girdiğiniz şifre hatalıdır.');
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

  const isRent = transactionType === 'KİRALAMA';
  const sellerTitle = isRent ? 'Kiraya Veren' : 'Satıcı Tarafı';
  const buyerTitle = isRent ? 'Kiralayan / Kiracı' : 'Alıcı Tarafı';

  // Dinamik Müşteri Fonksiyonları (İşlem Girişi)
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

  // MÜLK PORTFÖYÜ: Yeni Mülk Sahip Fonksiyonları
  const addNewPropOwner = () => {
    setNewPropOwnersList([...newPropOwnersList, { id: Math.random().toString(), mode: 'select', name: '' }]);
  };
  const removeNewPropOwner = (id: string) => {
    if (newPropOwnersList.length === 1) {
      setNewPropOwnersList([{ id: Math.random().toString(), mode: 'select', name: '' }]);
      return;
    }
    setNewPropOwnersList(newPropOwnersList.filter(o => o.id !== id));
  };
  const updateNewPropOwner = (id: string, field: 'mode' | 'name', value: any) => {
    setNewPropOwnersList(newPropOwnersList.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  // Hızlı Sahip Atama Fonksiyonları
  const addQuickOwner = () => {
    setQuickAssignOwners([...quickAssignOwners, { id: Math.random().toString(), mode: 'select', name: '' }]);
  };
  const removeQuickOwner = (id: string) => {
    if (quickAssignOwners.length === 1) {
      setQuickAssignOwners([{ id: Math.random().toString(), mode: 'select', name: '' }]);
      return;
    }
    setQuickAssignOwners(quickAssignOwners.filter(o => o.id !== id));
  };
  const updateQuickOwner = (id: string, field: 'mode' | 'name', value: any) => {
    setQuickAssignOwners(quickAssignOwners.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const allSellerNames = useMemo(() => sellerCustomers.map(c => c.name.trim()).filter(Boolean), [sellerCustomers]);
  const allBuyerNames = useMemo(() => buyerCustomers.map(c => c.name.trim()).filter(Boolean), [buyerCustomers]);

  // TAŞINMAZ SEÇİLDİĞİNDE: SATICI / KİRAYA VEREN BİLGİSİNİ OTOMATİK DOLDURMA
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
      
      // Mülkün kayıtlı sahipleri varsa doğrudan Satıcı/Kiraya Veren alanına aktar
      if (prop.owner_names && prop.owner_names.length > 0) {
        setSellerCustomers(prop.owner_names.map((name, i) => ({
          id: (i + 1).toString(),
          mode: 'new',
          name: name
        })));
      } else {
        // Sahipsiz mülk seçildiyse boş müşteri satırı aç
        setSellerCustomers([{ id: '1', mode: 'select', name: '' }]);
      }
    }
  };

  // KOMİSYON & HAK EDİŞ MOTORU
  const selectedSellerAgent = agents.find(a => a.id === sellerAgentId);
  const selectedBuyerAgent = agents.find(a => a.id === buyerAgentId);

  const sellerBaseComm = isRent 
    ? (propertyPrice / 2) 
    : (sellerCommType === 'percentage' ? (propertyPrice * (sellerCommValue || 0)) / 100 : (sellerCommValue || 0));

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

  const isSellerPartner = selectedSellerAgent?.is_partner === true;
  const sellerAgentAppliedRate = selectedSellerAgent ? (isSellerPartner ? 80 : selectedSellerAgent.commission_rate) : 50;
  const sellerAgentPayoutRate = isSellerPartner ? 70 : sellerAgentAppliedRate;

  const sellerAgentGross = (sellerBaseComm * sellerAgentAppliedRate) / 100;
  const sellerCorporateShare = isSellerPartner ? (sellerBaseComm * 10) / 100 : 0;
  const sellerTaxDeduction = (sellerNetInvoiceBase * 0.25 * (sellerAgentPayoutRate / 100));
  const sellerTotalExpenseAmount = sellerExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const sellerPartnerAmount = sellerHasPartner ? (Number(sellerPartnerShare) || 0) : 0;
  const sellerAgentNet = Math.max(0, (sellerBaseComm * sellerAgentPayoutRate) / 100 - sellerPartnerAmount - sellerTotalExpenseAmount - sellerTaxDeduction);
  const sellerOfficeNet = Math.max(0, sellerBaseComm - sellerAgentGross + sellerCorporateShare);

  const buyerBaseComm = isRent 
    ? (propertyPrice / 2) 
    : (buyerCommType === 'percentage' ? (propertyPrice * (buyerCommValue || 0)) / 100 : (buyerCommValue || 0));

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
  const buyerAgentAppliedRate = selectedBuyerAgent ? (isBuyerPartner ? 80 : selectedBuyerAgent.commission_rate) : 50;
  const buyerAgentPayoutRate = isBuyerPartner ? 70 : buyerAgentAppliedRate;

  const buyerAgentGross = (buyerBaseComm * buyerAgentAppliedRate) / 100;
  const buyerCorporateShare = isBuyerPartner ? (buyerBaseComm * 10) / 100 : 0;
  const buyerTaxDeduction = (buyerNetInvoiceBase * 0.25 * (buyerAgentPayoutRate / 100));
  const buyerTotalExpenseAmount = buyerExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const buyerPartnerAmount = buyerHasPartner ? (Number(buyerPartnerShare) || 0) : 0;
  const buyerAgentNet = Math.max(0, (buyerBaseComm * buyerAgentPayoutRate) / 100 - buyerPartnerAmount - buyerTotalExpenseAmount - buyerTaxDeduction);
  const buyerOfficeNet = Math.max(0, buyerBaseComm - buyerAgentGross + buyerCorporateShare);

  const totalGrossCollection = sellerTotalGross + buyerTotalGross;
  const totalAgentEarnings = sellerAgentNet + buyerAgentNet;
  const totalCorporateShares = sellerCorporateShare + buyerCorporateShare;
  const totalPartnerShares = sellerPartnerAmount + buyerPartnerAmount;
  const totalExpenses = sellerTotalExpenseAmount + buyerTotalExpenseAmount;
  const totalTaxAmount = sellerTaxAmount + buyerTaxAmount;
  const totalTaxDeductions = sellerTaxDeduction + buyerTaxDeduction;
  const grandTotalDeductions = totalAgentEarnings + totalPartnerShares + totalExpenses + totalTaxAmount + totalTaxDeductions + totalCorporateShares;
  const totalOfficeNetIncome = sellerOfficeNet + buyerOfficeNet;

  const addExpense = (side: 'seller' | 'buyer') => {
    const newItem: ExpenseItem = { id: Math.random().toString(), expense_type_id: 'custom', custom_description: '', amount: 0 };
    if (side === 'seller') setSellerExpenses([...sellerExpenses, newItem]);
    else setBuyerExpenses([...buyerExpenses, newItem]);
  };
  const removeExpense = (side: 'seller' | 'buyer', id: string) => {
    if (side === 'seller') setSellerExpenses(sellerExpenses.filter(e => e.id !== id));
    else setBuyerExpenses(buyerExpenses.filter(e => e.id !== id));
  };
  const updateExpenseField = (side: 'seller' | 'buyer', itemId: string, field: 'custom_description' | 'amount', value: any) => {
    const updater = (list: ExpenseItem[]) => list.map(item => item.id === itemId ? { ...item, [field]: value } : item);
    if (side === 'seller') setSellerExpenses(updater(sellerExpenses));
    else setBuyerExpenses(updater(buyerExpenses));
  };

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

  // İŞLEM KAYDETME
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
      const countForYear = transactionsHistory.filter(t => new Date(t.created_at).getFullYear().toString().slice(-2) === yearShort).length + 1;
      const genCode = `360IC-${yearShort}-${countForYear.toString().padStart(3, '0')}`;

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

      // SATIŞ ise mülkiyeti otomatik alıcıya devret
      if (transactionType === 'SATIŞ' && targetProp) {
        await supabase.from('properties').update({ owner_names: allBuyerNames }).eq('id', targetProp.id);
      }

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

      // CRM Rehberine Ekle
      const contactsToSync: { full_name: string; contact_type: 'MUSTERI' | 'ORTAK' }[] = [];
      allSellerNames.forEach(n => contactsToSync.push({ full_name: n, contact_type: 'MUSTERI' }));
      allBuyerNames.forEach(n => contactsToSync.push({ full_name: n, contact_type: 'MUSTERI' }));
      if (sellerPartnerName) contactsToSync.push({ full_name: sellerPartnerName, contact_type: 'ORTAK' });
      if (buyerPartnerName) contactsToSync.push({ full_name: buyerPartnerName, contact_type: 'ORTAK' });

      for (const c of contactsToSync) {
        try { await supabase.from('contacts').insert(c); } catch {}
      }

      setSavedTransactionCode(genCode);
      setIsSavedLocked(true);
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

  // MÜLK KAYDETME (Dinamik Sahip Listesi)
  const handleCreateProperty = async () => {
    if (!newPropNo.trim() || !newPropTitle.trim()) return alert('Taşınmaz No ve Etiket İsmi zorunludur.');
    const validOwners = newPropOwnersList.map(o => o.name.trim()).filter(Boolean);

    // Yeni girilen mülk sahiplerini CRM Rehberine de ekle
    for (const owner of validOwners) {
      try { await supabase.from('contacts').insert({ full_name: owner, contact_type: 'MUSTERI' }); } catch {}
    }

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
      setNewPropOwnersList([{ id: '1', mode: 'select', name: '' }]);
      setNewPropNotes('');
      loadData();
    } else {
      alert('Hata: ' + error.message);
    }
  };

  // HIZLI SAHİP ATAMA (Kırmızı + Butonu İle Açılan)
  const handleQuickAssignSubmit = async () => {
    if (!assigningProperty) return;
    const validOwners = quickAssignOwners.map(o => o.name.trim()).filter(Boolean);

    for (const owner of validOwners) {
      try { await supabase.from('contacts').insert({ full_name: owner, contact_type: 'MUSTERI' }); } catch {}
    }

    const { error } = await supabase.from('properties').update({
      owner_names: validOwners
    }).eq('id', assigningProperty.id);

    if (!error) {
      alert('Mülk sahipleri başarıyla atandı!');
      setAssigningProperty(null);
      loadData();
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const openQuickAssignModal = (prop: Property) => {
    setAssigningProperty(prop);
    if (prop.owner_names && prop.owner_names.length > 0) {
      setQuickAssignOwners(prop.owner_names.map((name, i) => ({ id: (i + 1).toString(), mode: 'new', name })));
    } else {
      setQuickAssignOwners([{ id: '1', mode: 'select', name: '' }]);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Taşınmazı portföyden silmek istediğinize emin misiniz?')) return;
    await supabase.from('properties').delete().eq('id', id);
    loadData();
  };

  // Diğer Fonksiyonlar
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

  // Ortaklar Sermaye Takibi
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
      return { id: ag.id, code: ag.code, name: ag.full_name, office: ag.office_name || 'Merkez', totalCorporateCapital };
    });
    return { partnerList, grandTotalCapital: partnerList.reduce((a, b) => a + b.totalCorporateCapital, 0), currentYear };
  }, [agents, transactionsHistory]);

  // Analitik Özetleri
  const analyticsSummary = useMemo(() => {
    let totalSalesCount = 0;
    let totalRentCount = 0;
    let totalGrossVolume = 0;
    let totalOfficeNet = 0;

    const agentStats: Record<string, { id: string; name: string; office: string; count: number; gross: number; agentNet: number; officeNet: number }> = {};

    transactionsHistory.forEach(t => {
      if (t.transaction_type === 'SATIŞ') totalSalesCount++;
      else totalRentCount++;

      totalGrossVolume += Number(t.total_transaction_gross) || 0;
      totalOfficeNet += Number(t.total_office_net_income) || 0;

      if (t.seller_agent_id) {
        const ag = agents.find(a => a.id === t.seller_agent_id);
        const name = ag ? `[${ag.code}] ${ag.full_name}` : 'Danışman';
        if (!agentStats[t.seller_agent_id]) agentStats[t.seller_agent_id] = { id: t.seller_agent_id, name, office: ag?.office_name || 'Merkez', count: 0, gross: 0, agentNet: 0, officeNet: 0 };
        agentStats[t.seller_agent_id].count += 1;
        agentStats[t.seller_agent_id].gross += Number(t.seller_base_commission) || 0;
      }
      if (t.buyer_agent_id) {
        const ag = agents.find(a => a.id === t.buyer_agent_id);
        const name = ag ? `[${ag.code}] ${ag.full_name}` : 'Danışman';
        if (!agentStats[t.buyer_agent_id]) agentStats[t.buyer_agent_id] = { id: t.buyer_agent_id, name, office: ag?.office_name || 'Merkez', count: 0, gross: 0, agentNet: 0, officeNet: 0 };
        agentStats[t.buyer_agent_id].count += 1;
        agentStats[t.buyer_agent_id].gross += Number(t.buyer_base_commission) || 0;
      }
    });

    const topAgentsByCount = Object.values(agentStats).sort((a, b) => b.count - a.count);
    const topAgentsByGross = Object.values(agentStats).sort((a, b) => b.gross - a.gross);

    return {
      totalMulkTransactions: transactionsHistory.length,
      totalTarafTransactions: transactionsHistory.length * 2,
      totalSalesCount,
      totalRentCount,
      totalGrossVolume,
      totalOfficeNet,
      topAgentsByCount,
      topAgentsByGross
    };
  }, [transactionsHistory, agents]);

  // Seçili Mülk Tarihçesi
  const selectedPropertyHistory = useMemo(() => {
    if (!selectedPropertyFilter) return [];
    return transactionsHistory.filter(t => t.property_number === selectedPropertyFilter)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [transactionsHistory, selectedPropertyFilter]);

  const selectedPropertyObj = useMemo(() => {
    return properties.find(p => p.property_number === selectedPropertyFilter);
  }, [properties, selectedPropertyFilter]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 mb-2">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white">360 IC Türkiye</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Erişim Şifresi"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none"
            />
            {authError && <p className="text-xs text-red-400 font-bold">{authError}</p>}
            <button type="submit" className="w-full bg-amber-500 text-slate-950 py-3.5 rounded-xl font-black text-sm">Giriş Yap</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ÜST BAR */}
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
                <Calculator className="w-4 h-4" /> İşlem Girişi
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'properties' ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Home className="w-4 h-4 text-emerald-500" /> Mülk Portföyü ({properties.length})
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

            <button onClick={handleLogout} className="p-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-xs" title="Oturumu Kapat">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. SEKME: İŞLEM HESAPLAMA & GİRİŞİ */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">Kayıt Durumu:</span>
                {isSavedLocked ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                    <Check className="w-4 h-4" /> {savedTransactionCode} Sisteme Kaydedildi
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">Yeni Taslak</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isSavedLocked ? (
                  <>
                    <button onClick={() => setIsSavedLocked(false)} className="px-4 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Düzenle
                    </button>
                    <button onClick={handleResetForm} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow">
                      <RefreshCw className="w-3.5 h-3.5" /> Yeni İşlem Başlat
                    </button>
                  </>
                ) : (
                  <button
                    onClick={saveTransaction}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl font-bold shadow text-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {isSaving ? 'Kaydediliyor...' : 'İşlemi Kaydet'}
                  </button>
                )}

                <button onClick={() => downloadPDFFromRef(pdfRef)} className="flex items-center gap-2 bg-slate-900 text-amber-400 px-5 py-2 rounded-xl font-bold text-xs border border-slate-700">
                  <Download className="w-4 h-4" /> 1 Sayfa A4 PDF
                </button>
              </div>
            </div>

            {/* Taşınmaz Seçimi (Satıcı Bilgisini Otomatik Doldurur) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div className="lg:col-span-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-amber-600" />
                      İşleme Konu Taşınmaz (Zorunlu)
                    </label>
                    <button type="button" onClick={() => handleSelectProperty('')} className="text-[10px] font-bold text-amber-700 hover:underline">
                      Sıfırla / Elle Gir
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => handleSelectProperty(e.target.value)}
                      className="p-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                    >
                      <option value="">Portföyden Mülk Seçin</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.property_number}] {p.title} {p.owner_names?.length ? `(${p.owner_names.join(', ')})` : '(Sahipsiz)'}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Taşınmaz No"
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

            {/* SATICI & ALICI FORMLARI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SATICI / KİRAYA VEREN */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    {sellerTitle}
                  </h2>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    {allSellerNames.length > 1 ? `${allSellerNames.length} Kişi (Eşit Pay)` : 'Müşteri'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Portföy Danışmanı</label>
                  <select
                    value={sellerAgentId}
                    onChange={(e) => setSellerAgentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-bold"
                  >
                    <option value="">Danışman Seçin</option>
                    {activeAgents.map(a => (
                      <option key={a.id} value={a.id}>[{a.code}] {a.full_name} {a.is_partner ? '⭐ (ORTAK - %80)' : `(%${a.commission_rate})`}</option>
                    ))}
                  </select>
                </div>

                {/* Dinamik Müşteri Listesi (Taşınmaz seçilince otomatik dolar) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                      {sellerTitle} Müşterileri
                    </span>
                    <button
                      type="button"
                      onClick={addSellerCustomer}
                      className="flex items-center gap-1 text-xs bg-slate-900 text-amber-400 px-2.5 py-1.5 rounded-lg font-bold shadow-sm"
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
                              <button type="button" onClick={() => removeSellerCustomer(cust.id)} className="text-red-500">
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
                        <button type="button" onClick={() => setSellerCommType('percentage')} className={`px-3 py-1 rounded-md font-bold ${sellerCommType === 'percentage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>%</button>
                        <button type="button" onClick={() => setSellerCommType('fixed')} className={`px-3 py-1 rounded-md font-bold ${sellerCommType === 'fixed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>TL</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      {isRent ? (
                        <div className="text-xs font-bold text-slate-600 bg-white p-2 rounded-lg border">Kira / 2 (Standart)</div>
                      ) : (
                        <input
                          type="text"
                          value={sellerCommType === 'percentage' ? (sellerCommValue || '') : formatInputDisplay(sellerCommValue)}
                          onChange={(e) => setSellerCommValue(sellerCommType === 'percentage' ? (e.target.value === '' ? 0 : Number(e.target.value)) : parseInputValue(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Matrah</div>
                      <div className="font-black text-slate-900 text-sm">{formatMoney(sellerBaseComm)}</div>
                    </div>
                  </div>
                </div>

                {/* Fatura Durumu */}
                {!isRent ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                    <span className="text-xs font-bold text-slate-800 block">Fatura Seçeneği</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => setSellerInvoiceType('unbilled')} className={`py-2 text-xs font-bold rounded-lg border ${sellerInvoiceType === 'unbilled' ? 'bg-slate-900 text-amber-500 border-slate-900' : 'bg-white'}`}>Faturasız</button>
                      <button type="button" onClick={() => setSellerInvoiceType('full')} className={`py-2 text-xs font-bold rounded-lg border ${sellerInvoiceType === 'full' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white'}`}>Tam Fatura</button>
                      <button type="button" onClick={() => setSellerInvoiceType('partial')} className={`py-2 text-xs font-bold rounded-lg border ${sellerInvoiceType === 'partial' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white'}`}>Kısmi</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 font-bold">
                    ℹ️ Kiraya verene fatura kesilmez (komisyonu kiracı öder).
                  </div>
                )}

                {/* Hak Ediş Özeti */}
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Brüt Marj (%{sellerAgentAppliedRate}):</span>
                    <b className="text-slate-900">{formatMoney(sellerAgentGross)}</b>
                  </div>
                  {isSellerPartner && (
                    <div className="flex justify-between text-amber-900 font-bold bg-amber-100/80 p-1.5 rounded-lg">
                      <span>Kurumsal Pay (%10 Şirket Sermayesi):</span>
                      <b>- {formatMoney(sellerCorporateShare)}</b>
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
                    {allBuyerNames.length > 1 ? `${allBuyerNames.length} Kişi (Eşit Pay)` : 'Müşteri'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Danışmanı</label>
                  <select
                    value={buyerAgentId}
                    onChange={(e) => setBuyerAgentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-bold"
                  >
                    <option value="">Danışman Seçin</option>
                    {activeAgents.map(a => (
                      <option key={a.id} value={a.id}>[{a.code}] {a.full_name} {a.is_partner ? '⭐ (ORTAK - %80)' : `(%${a.commission_rate})`}</option>
                    ))}
                  </select>
                </div>

                {/* Dinamik Müşteri Listesi */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {buyerTitle} Müşterileri
                    </span>
                    <button
                      type="button"
                      onClick={addBuyerCustomer}
                      className="flex items-center gap-1 text-xs bg-slate-900 text-emerald-400 px-2.5 py-1.5 rounded-lg font-bold shadow-sm"
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
                              <button type="button" onClick={() => removeBuyerCustomer(cust.id)} className="text-red-500">
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
                        <button type="button" onClick={() => setBuyerCommType('percentage')} className={`px-3 py-1 rounded-md font-bold ${buyerCommType === 'percentage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>%</button>
                        <button type="button" onClick={() => setBuyerCommType('fixed')} className={`px-3 py-1 rounded-md font-bold ${buyerCommType === 'fixed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>TL</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      {isRent ? (
                        <div className="text-xs font-bold text-slate-600 bg-white p-2 rounded-lg border">Kira / 2 (Standart)</div>
                      ) : (
                        <input
                          type="text"
                          value={buyerCommType === 'percentage' ? (buyerCommValue || '') : formatInputDisplay(buyerCommValue)}
                          onChange={(e) => setBuyerCommValue(buyerCommType === 'percentage' ? (e.target.value === '' ? 0 : Number(e.target.value)) : parseInputValue(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Matrah</div>
                      <div className="font-black text-slate-900 text-sm">{formatMoney(buyerBaseComm)}</div>
                    </div>
                  </div>
                </div>

                {/* Fatura Durumu */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Fatura Seçeneği</span>
                    {isRent && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Tam Fatura = 1 Kira ({formatMoney(propertyPrice)})</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setBuyerInvoiceType('unbilled')} className={`py-2 text-xs font-bold rounded-lg border ${buyerInvoiceType === 'unbilled' ? 'bg-slate-900 text-amber-500 border-slate-900' : 'bg-white'}`}>Faturasız</button>
                    <button type="button" onClick={() => setBuyerInvoiceType('full')} className={`py-2 text-xs font-bold rounded-lg border ${buyerInvoiceType === 'full' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'}`}>Tam Fatura</button>
                    <button type="button" onClick={() => setBuyerInvoiceType('partial')} className={`py-2 text-xs font-bold rounded-lg border ${buyerInvoiceType === 'partial' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white'}`}>Kısmi</button>
                  </div>
                </div>

                {/* Hak Ediş Özeti */}
                <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Brüt Marj (%{buyerAgentAppliedRate}):</span>
                    <b className="text-slate-900">{formatMoney(buyerAgentGross)}</b>
                  </div>
                  {isBuyerPartner && (
                    <div className="flex justify-between text-emerald-900 font-bold bg-emerald-100/80 p-1.5 rounded-lg">
                      <span>Kurumsal Pay (%10 Şirket Sermayesi):</span>
                      <b>- {formatMoney(buyerCorporateShare)}</b>
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
                  </div>
                </div>
                <div className="sm:text-right bg-slate-900 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">{transactionType} İŞLEM BEDELİ</span>
                  <p className="text-xl font-black text-white">{formatMoney(propertyPrice)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-black text-amber-600 border-b pb-1 flex justify-between">
                    <span>{sellerTitle}</span>
                    <span className="text-slate-500">{selectedSellerAgent ? `[${selectedSellerAgent.code}] ${selectedSellerAgent.full_name}` : 'Atanmadı'}</span>
                  </div>
                  <div className="flex justify-between"><span>Müşteriler:</span><b>{allSellerNames.join(', ') || '-'}</b></div>
                  <div className="flex justify-between"><span>Matrah:</span><b>{formatMoney(sellerBaseComm)}</b></div>
                  {isSellerPartner && <div className="flex justify-between text-amber-900 font-bold"><span>Kurumsal Pay (%10):</span><b>- {formatMoney(sellerCorporateShare)}</b></div>}
                  <div className="flex justify-between text-amber-700 font-black pt-1 border-t text-sm">
                    <span>Net Hak Ediş:</span><b>{formatMoney(sellerAgentNet)}</b>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-black text-emerald-600 border-b pb-1 flex justify-between">
                    <span>{buyerTitle}</span>
                    <span className="text-slate-500">{selectedBuyerAgent ? `[${selectedBuyerAgent.code}] ${selectedBuyerAgent.full_name}` : 'Atanmadı'}</span>
                  </div>
                  <div className="flex justify-between"><span>Müşteriler:</span><b>{allBuyerNames.join(', ') || '-'}</b></div>
                  <div className="flex justify-between"><span>Matrah:</span><b>{formatMoney(buyerBaseComm)}</b></div>
                  {isBuyerPartner && <div className="flex justify-between text-emerald-900 font-bold"><span>Kurumsal Pay (%10):</span><b>- {formatMoney(buyerCorporateShare)}</b></div>}
                  <div className="flex justify-between text-emerald-700 font-black pt-1 border-t text-sm">
                    <span>Net Hak Ediş:</span><b>{formatMoney(buyerAgentNet)}</b>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs text-amber-500 font-black uppercase tracking-wider block">360 IC - ŞİRKET NET KAZANCI</span>
                  <p className="text-[10px] text-slate-400">Ofis payı ve ortak sermaye fonları dahil</p>
                </div>
                <span className="text-xl font-black text-white">{formatMoney(totalOfficeNetIncome)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. SEKME: MÜLK PORTFÖYÜ (Dinamik Sahip Listesi & Kırmızı + Sahipsiz Mülk Uyarısı) */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Home className="w-5 h-5 text-emerald-600" />
                    Taşınmaz Portföyü ({properties.length})
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Mülklerinizi kaydedin; sahipleri rehberden seçin veya yeni ekleyin. Sahipsiz mülkleri kırmızı işaretle hızlıca tespit edebilirsiniz.</p>
                </div>
                <input
                  type="text"
                  placeholder="Taşınmaz no veya isim ara..."
                  value={propertySearchQuery}
                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                  className="p-2 border border-slate-300 rounded-xl text-xs font-semibold w-64"
                />
              </div>

              {/* Yeni Mülk Kayıt Formu (Dinamik Mülk Sahibi Girişi) */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
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
                    placeholder="Şehir / İlçe (Bursa)"
                    value={newPropCity}
                    onChange={(e) => setNewPropCity(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                </div>

                {/* Dinamik Mülk Sahibi Listesi (Rehberden Seç / Yeni Ekle) */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Mülk Sahibi / Ortakları (Opsiyonel - Boş Bırakılabilir)
                    </span>
                    <button
                      type="button"
                      onClick={addNewPropOwner}
                      className="text-xs bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg font-bold"
                    >
                      + Sahip / Hissedar Ekle
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newPropOwnersList.map((owner, idx) => (
                      <div key={owner.id} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-xs font-black text-slate-500 w-16">Sahip {idx + 1}:</span>
                        
                        <div className="flex-1 w-full flex gap-2 items-center">
                          {owner.mode === 'select' ? (
                            <select
                              value={owner.name}
                              onChange={(e) => updateNewPropOwner(owner.id, 'name', e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                            >
                              <option value="">Rehberden Kayıtlı Müşteri Seçin</option>
                              {contacts.filter(c => c.contact_type === 'MUSTERI').map(c => (
                                <option key={c.id} value={c.full_name}>{c.full_name} {c.company ? `(${c.company})` : ''}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder={`Sahip ${idx + 1} Ad Soyad`}
                              value={owner.name}
                              onChange={(e) => updateNewPropOwner(owner.id, 'name', e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              updateNewPropOwner(owner.id, 'mode', owner.mode === 'select' ? 'new' : 'select');
                              updateNewPropOwner(owner.id, 'name', '');
                            }}
                            className="px-2.5 py-2 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 shrink-0"
                          >
                            {owner.mode === 'select' ? '✏️ Yeni Yaz' : '📖 Rehber'}
                          </button>

                          {newPropOwnersList.length > 1 && (
                            <button type="button" onClick={() => removeNewPropOwner(owner.id)} className="text-red-500 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateProperty}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                  >
                    + Taşınmazı Portföye Kaydet
                  </button>
                </div>
              </div>

              {/* Mülk Kartları (Kırmızı + Sahipsiz Mülk Uyarısı) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.filter(p => 
                  p.property_number.includes(propertySearchQuery) || 
                  p.title.toLowerCase().includes(propertySearchQuery.toLowerCase())
                ).map(p => {
                  const hasOwner = p.owner_names && p.owner_names.length > 0 && p.owner_names.some(Boolean);
                  return (
                    <div key={p.id} className={`p-4 rounded-xl border space-y-3 relative transition ${hasOwner ? 'bg-slate-50 border-slate-200' : 'bg-red-50/40 border-red-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">No: {p.property_number}</span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{p.title}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDeleteProperty(p.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Mülk Sahibi Durumu / Kırmızı + Butonu */}
                      <div className="text-xs pt-1 border-t border-slate-200">
                        {hasOwner ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Mülk Sahibi(leri):</span>
                            <span className="font-black text-emerald-700 block">{p.owner_names.join(', ')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-red-100/70 p-2 rounded-lg border border-red-200">
                            <div className="flex items-center gap-1 text-red-700 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Sahibi Tanımlanmamış</span>
                            </div>
                            <button
                              onClick={() => openQuickAssignModal(p)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-black text-xs flex items-center gap-1 shadow"
                              title="Sahip Ata"
                            >
                              <Plus className="w-3.5 h-3.5" /> Sahip Ata
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPropertyFilter(p.property_number);
                          setAnalyticsSubView('portfolio');
                          setActiveTab('analytics');
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-black text-amber-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                      >
                        <History className="w-3.5 h-3.5" /> Yaşam Döngüsünü İncele
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. SEKME: RAPORLAR & ANALİZ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setAnalyticsSubView('general')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition ${analyticsSubView === 'general' ? 'bg-slate-900 text-amber-400 shadow' : 'text-slate-600'}`}
                >
                  📊 Genel Finans & Performans
                </button>
                <button
                  onClick={() => setAnalyticsSubView('portfolio')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition ${analyticsSubView === 'portfolio' ? 'bg-slate-900 text-amber-400 shadow' : 'text-slate-600'}`}
                >
                  🏢 Mülk Yaşam Döngüsü & Tarihçe
                </button>
              </div>

              {analyticsSubView === 'portfolio' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">İncelenecek Mülk:</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">İşlem Hacmi</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-slate-900">{analyticsSummary.totalMulkTransactions}</span>
                      <span className="text-xs font-bold text-slate-500">Mülk</span>
                    </div>
                    <span className="text-[11px] text-amber-600 font-bold block mt-1">({analyticsSummary.totalTarafTransactions} Taraf İşlemi)</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Toplam Kasa Geliri</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{formatMoney(analyticsSummary.totalGrossVolume)}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kayıtlı Taşınmazlar</span>
                    <div className="text-3xl font-black text-slate-900 mt-1">{properties.length}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">360 IC Şirket Kazancı</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">{formatMoney(analyticsSummary.totalOfficeNet)}</div>
                  </div>
                </div>

                {/* Ortaklar Sermaye Takibi Accordion */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setIsCapitalAccordionOpen(!isCapitalAccordionOpen)}
                    className="w-full p-5 bg-slate-900 text-white flex justify-between items-center"
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
                    <div className="p-6 bg-slate-50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {partnerCapitalStats.partnerList.map(pt => (
                          <div key={pt.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-xs font-bold text-slate-500">[{pt.code}] {pt.name}</span>
                            <div className="text-xl font-black text-slate-900">{formatMoney(pt.totalCorporateCapital)}</div>
                            <span className="text-[10px] text-amber-600 font-bold uppercase">{pt.office} Katkısı</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                        <span className="font-black text-slate-800 text-sm">ORTAKLAR TOPLAM SERMAYE KATKISI (ALT YEKÜN):</span>
                        <span className="text-xl font-black text-amber-900">{formatMoney(partnerCapitalStats.grandTotalCapital)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* MÜLK YAŞAM DÖNGÜSÜ ZAMAN TÜNELİ */
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                {selectedPropertyObj ? (
                  <div className="space-y-6">
                    <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">TAŞINMAZ YAŞAM DÖNGÜSÜ</span>
                        <h3 className="text-xl font-black mt-1">[{selectedPropertyObj.property_number}] {selectedPropertyObj.title}</h3>
                        <p className="text-xs text-slate-300 font-semibold mt-1">Güncel Sahip(ler): <b className="text-emerald-400">{selectedPropertyObj.owner_names?.join(', ') || 'Belirtilmedi'}</b></p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-bold">Toplam İşlem</span>
                        <span className="text-2xl font-black text-amber-400">{selectedPropertyHistory.length} Adet</span>
                      </div>
                    </div>

                    <div className="relative border-l-2 border-slate-300 pl-6 space-y-6 my-4 ml-4">
                      {selectedPropertyHistory.map((h) => (
                        <div key={h.id} className="relative group">
                          <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ${h.transaction_type === 'SATIŞ' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-slate-900">{new Date(h.created_at).toLocaleDateString('tr-TR')} • {h.transaction_code}</span>
                              <span className={`px-2 py-0.5 rounded font-black text-[10px] ${h.transaction_type === 'SATIŞ' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{h.transaction_type}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between text-xs gap-2 pt-1 border-t">
                              <div>
                                <span className="text-slate-500 font-bold block">{h.transaction_type === 'SATIŞ' ? 'Eski Sahip:' : 'Kiraya Veren:'}</span>
                                <span className="font-bold text-slate-900">{h.seller_parties?.join(', ') || h.seller_name}</span>
                              </div>
                              <div className="flex items-center text-slate-400 font-black">➔</div>
                              <div>
                                <span className="text-slate-500 font-bold block">{h.transaction_type === 'SATIŞ' ? 'Yeni Sahip:' : 'Kiracı:'}</span>
                                <span className="font-bold text-emerald-700">{h.buyer_parties?.join(', ') || h.buyer_name}</span>
                              </div>
                              <div className="sm:text-right">
                                <span className="text-slate-500 font-bold block">Bedel:</span>
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
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Contact2 className="w-5 h-5 text-amber-600" /> Kişi Rehberi ({contacts.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">Kayıtlı müşteriler ve harici ortaklar.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kişi ara..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  className="p-2 border rounded-xl text-xs w-56"
                />
                <button
                  onClick={() => setEditingContact({ id: '', full_name: '', contact_type: 'MUSTERI', phone: '', email: '', company: '', notes: '' })}
                  className="bg-slate-900 text-amber-400 px-3 py-2 rounded-xl text-xs font-bold shadow"
                >
                  + Yeni Kişi Ekle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.filter(c => c.full_name.toLowerCase().includes(contactSearchQuery.toLowerCase())).map(c => (
                <div key={c.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{c.full_name}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black">{c.contact_type}</span>
                    </div>
                    <button onClick={() => setEditingContact(c)} className="p-1 bg-white border rounded"><Edit3 className="w-3.5 h-3.5 text-slate-600" /></button>
                  </div>
                  <div className="text-xs text-slate-500">{c.phone && <div>📞 {c.phone}</div>}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SEKME: İŞLEM ARŞİVİ */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" /> İşlem Arşivi ({transactionsHistory.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-amber-500 font-black">
                    <th className="p-3.5">İşlem Kodu</th>
                    <th className="p-3.5">Tarih</th>
                    <th className="p-3.5">Tür</th>
                    <th className="p-3.5">Taşınmaz</th>
                    <th className="p-3.5">Satıcı / Kiraya Veren</th>
                    <th className="p-3.5">Alıcı / Kiracı</th>
                    <th className="p-3.5 text-right">Bedel</th>
                    <th className="p-3.5 text-right">Şirket Payı</th>
                    <th className="p-3.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-slate-50">
                  {transactionsHistory.map(row => (
                    <tr key={row.id} onClick={() => openHistoryDetail(row)} className="hover:bg-amber-50/60 cursor-pointer">
                      <td className="p-3.5 font-black">{row.transaction_code}</td>
                      <td className="p-3.5">{new Date(row.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 bg-slate-200 rounded font-black">{row.transaction_type}</span></td>
                      <td className="p-3.5 font-bold">[{row.property_number}] {row.property_title}</td>
                      <td className="p-3.5">{row.seller_parties?.join(', ') || row.seller_name}</td>
                      <td className="p-3.5">{row.buyer_parties?.join(', ') || row.buyer_name}</td>
                      <td className="p-3.5 text-right font-black">{formatMoney(Number(row.property_price))}</td>
                      <td className="p-3.5 text-right font-black text-emerald-600">{formatMoney(Number(row.total_office_net_income))}</td>
                      <td className="p-3.5 text-right space-x-1">
                        <button onClick={(e) => { e.stopPropagation(); openHistoryDetail(row); }} className="p-1.5 bg-slate-900 text-amber-400 rounded"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(row.id); }} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. SEKME: SİSTEM TANIMLARI */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-slate-900 space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-black text-slate-900">Temsilci Kadrosu & Ortaklık</h2>
                <span className="text-xs font-bold text-slate-500">{agents.length} Danışman</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Kod (363)" value={newAgentCode} onChange={(e) => setNewAgentCode(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                  <input type="text" placeholder="Ad Soyad" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Ofis (Nilüfer vb.)" value={newAgentOffice} onChange={(e) => setNewAgentOffice(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer">
                    <input type="checkbox" checked={newAgentIsPartner} onChange={(e) => setNewAgentIsPartner(e.target.checked)} className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold">Şirket Ortağı (%80)</span>
                  </label>
                </div>
                {!newAgentIsPartner && (
                  <input type="number" placeholder="Hak Ediş Oranı (%50)" value={newAgentRate || ''} onChange={(e) => setNewAgentRate(Number(e.target.value))} className="w-full p-2 border rounded-lg text-xs font-bold" />
                )}
                <button onClick={handleAddAgent} className="w-full bg-slate-900 text-amber-400 py-2.5 rounded-lg text-xs font-black shadow">+ Temsilciyi Kaydet</button>
              </div>
              <div className="space-y-2">
                {agents.map(a => (
                  <div key={a.id} className="flex justify-between items-center p-3 rounded-xl border bg-slate-50 text-xs">
                    <div>
                      <span className="font-black text-amber-600">[{a.code}] </span>
                      <span className="font-bold text-slate-900">{a.full_name}</span>
                      {a.is_partner && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-900 font-black rounded text-[10px]">ORTAK</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAgentActiveStatus(a)} className="px-2 py-1 bg-slate-200 rounded font-bold text-[11px]">{a.is_active !== false ? 'Aktif' : 'Pasif'}</button>
                      <button onClick={() => handleDeleteAgent(a.id)} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500 space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-black text-slate-900">Standart Masraf Kalemleri</h2>
                <span className="text-xs font-bold text-slate-500">{expenseTypes.length} Masraf</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Gider Adı" value={newExpName} onChange={(e) => setNewExpName(e.target.value)} className="p-2 border rounded-lg text-xs font-bold" />
                  <input type="text" placeholder="Tutar" value={formatInputDisplay(newExpCost)} onChange={(e) => setNewExpCost(parseInputValue(e.target.value))} className="p-2 border rounded-lg text-xs font-bold" />
                </div>
                <button onClick={handleAddExpenseType} className="w-full bg-amber-600 text-white py-2.5 rounded-lg text-xs font-black shadow">+ Kalemi Kaydet</button>
              </div>
              <div className="space-y-2">
                {expenseTypes.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border text-xs">
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded font-black">{formatMoney(t.default_cost)}</span>
                      <button onClick={() => handleDeleteExpenseType(t.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HIZLI SAHİP ATAMA MODALI (KIRMIZI + İÇİN) */}
        {assigningProperty && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Mülk Sahibi Ata & Tanımla</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">[{assigningProperty.property_number}] {assigningProperty.title}</p>
                </div>
                <button onClick={() => setAssigningProperty(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Mülk Sahipleri:</span>
                  <button onClick={addQuickOwner} className="text-xs bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg font-bold">+ Yeni Sahip Ekle</button>
                </div>

                <div className="space-y-2">
                  {quickAssignOwners.map((owner, idx) => (
                    <div key={owner.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 w-16">Sahip {idx + 1}:</span>
                      {owner.mode === 'select' ? (
                        <select
                          value={owner.name}
                          onChange={(e) => updateQuickOwner(owner.id, 'name', e.target.value)}
                          className="flex-1 p-2 rounded border text-xs font-bold bg-white"
                        >
                          <option value="">Rehberden Seçin</option>
                          {contacts.filter(c => c.contact_type === 'MUSTERI').map(c => (
                            <option key={c.id} value={c.full_name}>{c.full_name} {c.company ? `(${c.company})` : ''}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Ad Soyad"
                          value={owner.name}
                          onChange={(e) => updateQuickOwner(owner.id, 'name', e.target.value)}
                          className="flex-1 p-2 rounded border text-xs font-bold bg-white"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          updateQuickOwner(owner.id, 'mode', owner.mode === 'select' ? 'new' : 'select');
                          updateQuickOwner(owner.id, 'name', '');
                        }}
                        className="px-2 py-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded border"
                      >
                        {owner.mode === 'select' ? 'Yeni' : 'Rehber'}
                      </button>
                      {quickAssignOwners.length > 1 && (
                        <button type="button" onClick={() => removeQuickOwner(owner.id)} className="text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => setAssigningProperty(null)} className="w-1/2 bg-slate-100 py-2.5 rounded-xl text-xs font-bold">İptal</button>
                <button onClick={handleQuickAssignSubmit} className="w-1/2 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black shadow">Sahipleri Kaydet</button>
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
                    <h3 className="text-base font-black">Bordro Detayı ({selectedHistoryItem.transaction_code})</h3>
                    <p className="text-xs text-slate-400">Taşınmaz No: {selectedHistoryItem.property_number} • {new Date(selectedHistoryItem.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadPDFFromRef(modalPdfRef)} className="bg-amber-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> PDF
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
                      <div className="font-black border-b pb-1 text-amber-700">Satıcı / Kiraya Veren</div>
                      <div className="flex justify-between"><span>Müşteriler:</span><b>{selectedHistoryItem.seller_parties?.join(', ') || selectedHistoryItem.seller_name}</b></div>
                      <div className="flex justify-between"><span>Matrah:</span><b>{formatMoney(Number(selectedHistoryItem.seller_base_commission))}</b></div>
                      {Number(selectedHistoryItem.seller_corporate_share) > 0 && (
                        <div className="flex justify-between text-amber-900 font-bold"><span>Kurumsal Pay (%10):</span><b>- {formatMoney(Number(selectedHistoryItem.seller_corporate_share))}</b></div>
                      )}
                      <div className="flex justify-between text-amber-700 font-black pt-1 border-t"><span>Net Hak Ediş:</span><b>{formatMoney(Number(selectedHistoryItem.seller_agent_net_earning))}</b></div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border space-y-1.5">
                      <div className="font-black border-b pb-1 text-emerald-700">Alıcı / Kiralayan</div>
                      <div className="flex justify-between"><span>Müşteriler:</span><b>{selectedHistoryItem.buyer_parties?.join(', ') || selectedHistoryItem.buyer_name}</b></div>
                      <div className="flex justify-between"><span>Matrah:</span><b>{formatMoney(Number(selectedHistoryItem.buyer_base_commission))}</b></div>
                      {Number(selectedHistoryItem.buyer_corporate_share) > 0 && (
                        <div className="flex justify-between text-emerald-900 font-bold"><span>Kurumsal Pay (%10):</span><b>- {formatMoney(Number(selectedHistoryItem.buyer_corporate_share))}</b></div>
                      )}
                      <div className="flex justify-between text-emerald-700 font-black pt-1 border-t"><span>Net Hak Ediş:</span><b>{formatMoney(Number(selectedHistoryItem.buyer_agent_net_earning))}</b></div>
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