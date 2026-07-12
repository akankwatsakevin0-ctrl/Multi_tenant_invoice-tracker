// =============================================================================
// i18n Type Definitions
// =============================================================================

export type LanguageCode = 'en' | 'fr';

export interface TranslationSet {
  nav: {
    dashboard: string;
    invoices: string;
    clients: string;
    profile: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    clear: string;
    confirm: string;
    back: string;
    noData: string;
    showing: string;
    to: string;
    of: string;
    results: string;
    previous: string;
    next: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    confirmPassword: string;
    companyName: string;
    defaultCurrency: string;
    createAccount: string;
    noAccount: string;
    haveAccount: string;
    signOut: string;
    welcomeBack: string;
    accountCreated: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalInvoices: string;
    totalAmount: string;
    paid: string;
    overdue: string;
    invoicesByStatus: string;
    recentInvoices: string;
    displayedIn: string;
    vsLastMonth: string;
  };
  invoices: {
    title: string;
    subtitle: string;
    newInvoice: string;
    invoice: string;
    client: string;
    amount: string;
    currency: string;
    status: string;
    dueDate: string;
    invoiceNumber: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
    subtotal: string;
    lineItems: string;
    addItem: string;
    editInvoice: string;
    createInvoice: string;
    updateInvoice: string;
    noInvoices: string;
    invoiceCreated: string;
    invoiceUpdated: string;
    invoiceDeleted: string;
    filters: {
      allStatuses: string;
      allCurrencies: string;
      searchPlaceholder: string;
    };
  };
  clients: {
    title: string;
    subtitle: string;
    addClient: string;
    clientName: string;
    email: string;
    address: string;
    createClient: string;
    noClients: string;
    clientCreated: string;
  };
  profile: {
    title: string;
    subtitle: string;
    memberSince: string;
    preferences: string;
    displayCurrency: string;
    displayCurrencyDesc: string;
    gdpr: string;
    gdprDesc: string;
    dataExport: string;
    dataExportDesc: string;
    deleteAccount: string;
    deleteAccountDesc: string;
    deleteConfirm: string;
    deleteWarning: string;
    exportSuccess: string;
    exportError: string;
  };
  gdpr: {
    cookieTitle: string;
    cookieMessage: string;
    cookieAccept: string;
    cookieDecline: string;
    privacyPolicy: string;
    termsOfService: string;
    privacyTitle: string;
    privacyUpdated: string;
    termsTitle: string;
    termsUpdated: string;
  };
  language: {
    label: string;
    en: string;
    fr: string;
  };
  currency: {
    label: string;
    toggle: string;
  };
  errors: {
    required: string;
    invalidEmail: string;
    passwordLength: string;
    passwordMatch: string;
    notFound: string;
    generic: string;
  };
}
