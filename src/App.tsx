import React, { useState, useEffect, useRef, useCallback } from "react";
import { CONFIG, SERVICES } from "./config";
import { BeforeAfterShowcase } from "./components/BeforeAfterShowcase";

type ServiceId = "sofa" | "carpet" | "car" | "mattress";

interface QuoteState {
  step: number;
  service: ServiceId | "";
  size: string;
  conditions: string[];
  zone: string;
  date: string;
  time: string;
  name: string;
}

interface AnalyticsData {
  whatsapp: number;
  started: number;
  completed: number;
  steps: Record<number, number>;
  sources: Record<string, number>;
}

const DEFAULT_QUOTE_STATE: QuoteState = {
  step: 1,
  service: "",
  size: "",
  conditions: [],
  zone: "",
  date: "",
  time: "",
  name: ""
};

const DEFAULT_ANALYTICS: AnalyticsData = {
  whatsapp: 0,
  started: 0,
  completed: 0,
  steps: {},
  sources: {
    header: 0,
    flutuante: 0,
    "barra fixa": 0,
    orçamento: 0,
    hero: 0,
    final: 0,
    footer: 0
  }
};

function formatMoney(value: number): string {
  const number = Math.round(Number(value) || 0);
  return number.toLocaleString("pt-AO") + " " + CONFIG.currency;
}

function formatRange(min: number, max: number): string {
  if (!min && !max) return "A definir";
  if (min === max) return formatMoney(min);
  return `${formatMoney(min)} – ${formatMoney(max)}`;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function getWhatsAppUrl(message = ""): string {
  const cleanPhone = normalizePhone(CONFIG.company.whatsapp);
  if (!message && CONFIG.company.whatsappLink) {
    return CONFIG.company.whatsappLink;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function buildGenericWhatsAppMessage(): string {
  return `Olá, ${CONFIG.company.name}! Gostaria de pedir um orçamento para um serviço de limpeza/higienização.\n\nPodem ajudar-me?\n\nObrigado(a).`;
}

function getLuandaDateParts() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CONFIG.company.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const values: Record<string, string> = {};
  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    day: weekdays[values.weekday] ?? 1,
    time: `${values.hour}:${values.minute}`
  };
}

function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function getNextOpening(): string {
  const now = getLuandaDateParts();
  for (let i = 1; i <= 7; i++) {
    const nextDay = (now.day + i) % 7;
    const sched = CONFIG.schedule[nextDay];
    if (sched) {
      return `às ${sched.open}`;
    }
  }
  return "em breve";
}

function getBusinessStatus() {
  const now = getLuandaDateParts();
  const schedule = CONFIG.schedule[now.day];

  if (!schedule) {
    return {
      open: false,
      message: "Voltamos no próximo dia útil.",
      nextTime: getNextOpening()
    };
  }

  const current = minutesFromTime(now.time);
  const open = minutesFromTime(schedule.open);
  const close = minutesFromTime(schedule.close);

  if (current >= open && current < close) {
    return {
      open: true,
      message: `Estamos online, respondemos em cerca de ${CONFIG.company.responseTime}.`
    };
  }

  return {
    open: false,
    message: `Voltamos ${current < open ? "hoje" : "no próximo dia útil"} às ${schedule.open}.`,
    nextTime: current < open ? `hoje às ${schedule.open}` : getNextOpening()
  };
}

export function ServiceSvgIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "carpet":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M7 8h10M7 12h6M7 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "car":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 16l1.5-6h11L19 16M4 16h16v3H4zM7 19v2M17 19v2M7 13h10"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bed":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M4 15h16M6 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M4 18v2M20 18v2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "home":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 11l8-7 8 7v9H4zM9 20v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "sofa":
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M4 17v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5M4 17h16M6 17v3M18 17v3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export default function App() {
  // Navigation & UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [businessStatus, setBusinessStatus] = useState(() => getBusinessStatus());
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleSection, setVisibleSection] = useState<string>("inicio");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [showOwnerDashboard, setShowOwnerDashboard] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Quote Wizard state
  const [quoteState, setQuoteState] = useState<QuoteState>(DEFAULT_QUOTE_STATE);
  const [savedQuoteSnapshot, setSavedQuoteSnapshot] = useState<QuoteState | null>(null);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [quoteCompleted, setQuoteCompleted] = useState(false);
  const [lastQuoteWhatsAppUrl, setLastQuoteWhatsAppUrl] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Animated price state for Step 3
  const [displayedPrice, setDisplayedPrice] = useState<number>(0);
  const [pricePulse, setPricePulse] = useState(false);
  const displayedPriceRef = useRef(0);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const quoteStartedTrackedRef = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  // Load Analytics & Saved Quote Progress on mount
  useEffect(() => {
    try {
      const storedAnalytics = localStorage.getItem(CONFIG.analyticsStorageKey);
      if (storedAnalytics) {
        const parsed = JSON.parse(storedAnalytics);
        setAnalyticsData((prev) => ({
          ...prev,
          ...parsed,
          sources: { ...prev.sources, ...(parsed.sources || {}) }
        }));
      }
    } catch {
      // Ignore storage errors
    }

    try {
      const storedQuote = localStorage.getItem(CONFIG.storageKey);
      if (storedQuote) {
        const parsed: QuoteState = JSON.parse(storedQuote);
        if (parsed && (parsed.service || parsed.step > 1)) {
          setSavedQuoteSnapshot(parsed);
          setShowSavedBanner(true);
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Check hash for #resultados
    if (window.location.hash === "#resultados") {
      setShowOwnerDashboard(true);
    }
  }, []);

  // Business status interval
  useEffect(() => {
    const interval = window.setInterval(() => {
      setBusinessStatus(getBusinessStatus());
    }, 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Section IntersectionObserver for Smart Mobile Action Bar & Quote Start tracking
  useEffect(() => {
    const sectionIds = [
      "inicio",
      "antes-depois",
      "servicos",
      "orcamento",
      "como-funciona",
      "pacotes",
      "confianca",
      "zonas",
      "faq",
      "cta-final"
    ];

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (typeof IntersectionObserver === "undefined") return;

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    elements.forEach((el) => sectionObserver.observe(el));

    const orcamentoEl = document.getElementById("orcamento");
    let quoteObserver: IntersectionObserver | null = null;
    if (orcamentoEl) {
      quoteObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !quoteStartedTrackedRef.current) {
              quoteStartedTrackedRef.current = true;
              sendAnalyticsEvent("orcamento_iniciado", { origem: "secção_orcamento" });
            }
          });
        },
        { threshold: 0.35 }
      );
      quoteObserver.observe(orcamentoEl);
    }

    return () => {
      sectionObserver.disconnect();
      if (quoteObserver) quoteObserver.disconnect();
    };
  }, []);

  // Mobile keyboard detection
  useEffect(() => {
    if (!window.visualViewport) return;
    const initialHeight = window.visualViewport.height;
    const handleResize = () => {
      if (!window.visualViewport) return;
      const currentHeight = window.visualViewport.height;
      setKeyboardOpen(initialHeight - currentHeight > 140);
    };
    window.visualViewport.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  const saveQuoteToStorage = useCallback((stateToSave: QuoteState) => {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearQuoteStorage = useCallback(() => {
    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const sendAnalyticsEvent = useCallback(
    (eventName: string, props: Record<string, string | number> = {}) => {
      setAnalyticsData((prev) => {
        const next: AnalyticsData = {
          ...prev,
          steps: { ...prev.steps },
          sources: { ...prev.sources }
        };

        if (eventName === "orcamento_iniciado") {
          next.started += 1;
        }
        if (eventName === "orcamento_concluido") {
          next.completed += 1;
        }
        if (eventName === "clique_whatsapp") {
          next.whatsapp += 1;
          const source = String(props.origem || "desconhecido");
          next.sources[source] = (next.sources[source] || 0) + 1;
        }
        if (eventName === "passo_concluido") {
          const stepNum = Number(props.passo || 0);
          next.steps[stepNum] = (next.steps[stepNum] || 0) + 1;
        }

        try {
          localStorage.setItem(CONFIG.analyticsStorageKey, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });
    },
    []
  );

  // Pricing calculation
  const getBasePrice = useCallback((service: ServiceId | "", size: string) => {
    if (!service || !size) return { min: 0, max: 0 };
    if (service === "sofa") {
      const item = CONFIG.prices.sofa[size];
      return item ? { min: item.min, max: item.max } : { min: 0, max: 0 };
    }
    if (service === "carpet") {
      const item = CONFIG.prices.carpet[size] || CONFIG.prices.carpet.m2;
      return item ? { min: item.min, max: item.max } : { min: 0, max: 0 };
    }
    if (service === "car") {
      const item = CONFIG.prices.car[size];
      return item ? { min: item.min, max: item.max } : { min: 0, max: 0 };
    }
    if (service === "mattress") {
      const item = CONFIG.prices.mattress[size];
      return item ? { min: item.min, max: item.max } : { min: 0, max: 0 };
    }
    return { min: 0, max: 0 };
  }, []);

  const calculateEstimate = useCallback(
    (state: QuoteState = quoteState) => {
      let { min, max } = getBasePrice(state.service, state.size);
      const reasons: string[] = [];

      if (!min && !max) {
        return { min: 0, max: 0, reason: "Preço a confirmar" };
      }

      if (state.conditions.includes("strongStains")) {
        const percentage = CONFIG.prices.extras.strongStains.value / 100;
        min += min * percentage;
        max += max * percentage;
        reasons.push("+ manchas fortes");
      }

      if (state.conditions.includes("odor")) {
        min += CONFIG.prices.extras.odor.value;
        max += CONFIG.prices.extras.odor.value;
        reasons.push("+ remoção de cheiro");
      }

      if (state.conditions.includes("petHair")) {
        min += CONFIG.prices.extras.petHair.value;
        max += CONFIG.prices.extras.petHair.value;
        reasons.push("+ pelos de animais");
      }

      if (!reasons.length) {
        reasons.push("Preço base");
      }

      return {
        min: Math.round(min),
        max: Math.round(max),
        reason: reasons.join(" · ")
      };
    },
    [getBasePrice, quoteState]
  );

  const currentEstimate = calculateEstimate(quoteState);

  // Smooth price animation when estimate changes
  useEffect(() => {
    const target = currentEstimate.min || currentEstimate.max || 0;
    const start = displayedPriceRef.current;
    const difference = target - start;
    if (difference === 0) return;

    const duration = 380;
    const startTime = performance.now();
    let rafId: number;

    const frame = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(start + difference * eased);
      displayedPriceRef.current = nextVal;
      setDisplayedPrice(nextVal);

      if (progress < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        setPricePulse(true);
        window.setTimeout(() => setPricePulse(false), 450);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [currentEstimate.min, currentEstimate.max]);

  const getSizeOptions = (service: ServiceId | "") => {
    if (service === "sofa") {
      return Object.entries(CONFIG.prices.sofa).map(([key, value]) => ({
        key,
        label: value.label,
        price: value.min
      }));
    }
    if (service === "carpet") {
      return Object.entries(CONFIG.prices.carpet).map(([key, value]) => ({
        key,
        label: value.label,
        price: value.min
      }));
    }
    if (service === "car") {
      return Object.entries(CONFIG.prices.car).map(([key, value]) => ({
        key,
        label: value.label,
        price: value.min
      }));
    }
    if (service === "mattress") {
      return Object.entries(CONFIG.prices.mattress).map(([key, value]) => ({
        key,
        label: value.label,
        price: value.min
      }));
    }
    return [];
  };

  const getServiceName = (serviceId: ServiceId | "") => {
    const found = SERVICES.find((s) => s.id === serviceId);
    return found ? found.name : serviceId;
  };

  const getSizeName = (service: ServiceId | "", size: string) => {
    if (service === "sofa") return CONFIG.prices.sofa[size]?.label || size;
    if (service === "carpet") return CONFIG.prices.carpet[size]?.label || size;
    if (service === "car") return CONFIG.prices.car[size]?.label || size;
    if (service === "mattress") return CONFIG.prices.mattress[size]?.label || size;
    return size;
  };

  const getConditionNames = (conditions: string[]) => {
    const labels: Record<string, string> = {
      light: "Manchas leves",
      strongStains: "Manchas fortes",
      odor: "Mau cheiro",
      petHair: "Pelos de animais"
    };
    return (
      conditions.map((c) => labels[c] || c).join(", ") || "Uso normal / Manchas leves"
    );
  };

  const formatDateForMessage = (dateString: string) => {
    if (!dateString) return "Não especificado";
    const date = new Date(`${dateString}T12:00:00`);
    return date.toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const buildQuoteMessage = () => {
    const estimate = calculateEstimate(quoteState);
    return `Olá, ${CONFIG.company.name}! 👋

Gostaria de confirmar um orçamento.

🧼 SERVIÇO
${getServiceName(quoteState.service)}

📏 TAMANHO / TIPO
${getSizeName(quoteState.service, quoteState.size)}

🧽 ESTADO
${getConditionNames(quoteState.conditions)}

💰 ESTIMATIVA
${formatRange(estimate.min, estimate.max)}

📍 ZONA
${quoteState.zone}

📅 DATA
${formatDateForMessage(quoteState.date)}

⏰ HORA
${quoteState.time}

👤 NOME
${quoteState.name}

Vou enviar as fotos a seguir.`;
  };

  const goToStep = (nextStep: number, direction: "forward" | "back" = "forward") => {
    if (direction === "forward" && nextStep > 1) {
      setCompletedSteps((prev) =>
        prev.includes(nextStep - 1) ? prev : [...prev, nextStep - 1]
      );
    }
    setQuoteCompleted(false);
    setQuoteState((prev) => {
      const updated = { ...prev, step: nextStep };
      saveQuoteToStorage(updated);
      return updated;
    });

    if (nextStep > 1 && window.innerWidth < 768) {
      const appEl = document.getElementById("quoteApp");
      if (appEl) {
        const top = appEl.getBoundingClientRect().top + window.scrollY - 85;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const handleSelectServiceFromPage = (serviceId: ServiceId) => {
    setQuoteCompleted(false);
    setQuoteState((prev) => {
      const updated: QuoteState = {
        ...prev,
        service: serviceId,
        size: "",
        step: 2
      };
      saveQuoteToStorage(updated);
      return updated;
    });
    setCompletedSteps([1]);
    sendAnalyticsEvent("orcamento_iniciado", { origem: "servicos" });
  };

  const handleToggleCondition = (conditionKey: string) => {
    setQuoteState((prev) => {
      let nextConditions: string[];
      if (conditionKey === "light") {
        nextConditions = prev.conditions.includes("light") ? [] : ["light"];
      } else {
        const withoutLight = prev.conditions.filter((item) => item !== "light");
        if (withoutLight.includes(conditionKey)) {
          nextConditions = withoutLight.filter((item) => item !== conditionKey);
        } else {
          nextConditions = [...withoutLight, conditionKey];
        }
      }
      const updated = { ...prev, conditions: nextConditions };
      saveQuoteToStorage(updated);
      return updated;
    });
  };

  const isStep4Complete = Boolean(
    quoteState.name.trim() &&
      quoteState.zone.trim() &&
      quoteState.date &&
      quoteState.time &&
      quoteState.service &&
      quoteState.size
  );

  const handleConfirmQuote = () => {
    if (!isStep4Complete) {
      showToast("Preencha o nome, zona, data e hora para confirmar.");
      return;
    }

    sendAnalyticsEvent("passo_concluido", { passo: 4 });
    sendAnalyticsEvent("orcamento_concluido", {
      servico: getServiceName(quoteState.service)
    });
    sendAnalyticsEvent("clique_whatsapp", { origem: "orçamento" });

    const message = buildQuoteMessage();
    const whatsappUrl = getWhatsAppUrl(message);
    setLastQuoteWhatsAppUrl(whatsappUrl);
    clearQuoteStorage();
    setShowSavedBanner(false);
    setQuoteCompleted(true);
  };

  // Minimum date for date input (today)
  const todayIso = new Date().toISOString().split("T")[0];
  const genericWhatsAppUrl = getWhatsAppUrl(buildGenericWhatsAppMessage());

  // Mobile Smart Action Bar config
  const getMobileActionConfig = () => {
    if (visibleSection === "orcamento" && quoteCompleted) {
      return {
        text: "Abrir WhatsApp",
        hint: "Envie as suas fotos",
        action: "success" as const
      };
    }
    if (visibleSection === "orcamento") {
      return {
        text: quoteState.step < 4 ? "Continuar passo" : "Confirmar orçamento",
        hint: `Passo ${quoteState.step} de 4`,
        action: "quote" as const
      };
    }
    if (visibleSection === "servicos") {
      return {
        text: "Ver preço",
        hint: "Escolha um serviço",
        action: "scrollQuote" as const
      };
    }
    return {
      text: "Pedir orçamento",
      hint: "Estimativa em 1 minuto",
      action: "scrollQuote" as const
    };
  };

  const mobileAction = getMobileActionConfig();

  const handleMobileActionClick = () => {
    if (mobileAction.action === "scrollQuote") {
      document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (mobileAction.action === "quote") {
      if (quoteState.step === 1) {
        if (!quoteState.service) {
          showToast("Escolha um serviço primeiro.");
          return;
        }
        sendAnalyticsEvent("passo_concluido", { passo: 1 });
        goToStep(2, "forward");
      } else if (quoteState.step === 2) {
        if (!quoteState.size) {
          showToast("Escolha o tamanho / tipo.");
          return;
        }
        sendAnalyticsEvent("passo_concluido", { passo: 2 });
        goToStep(3, "forward");
      } else if (quoteState.step === 3) {
        sendAnalyticsEvent("passo_concluido", { passo: 3 });
        goToStep(4, "forward");
      } else if (quoteState.step === 4) {
        handleConfirmQuote();
      }
    }
  };

  // Analytics derived metrics
  const completionRate = analyticsData.started
    ? Math.round((analyticsData.completed / analyticsData.started) * 100)
    : 0;
  const sortedSources = (Object.entries(analyticsData.sources) as [string, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* =========================================================
          HEADER (Strict 3-Zone Top Bar Contract)
         ========================================================== */}
      <header
        id="siteHeader"
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-100/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[72px] flex items-center justify-between gap-4">
            {/* Zone 1: Brand Title */}
            <a
              href="#inicio"
              className="font-display font-extrabold text-xl tracking-tight text-slate-900 shrink-0"
            >
              {CONFIG.company.name}
            </a>

            {/* Zone 2: Primary Navigation Links */}
            <nav className="desktop-nav hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
              <a href="#antes-depois" className="hover:text-slate-900 transition-colors">
                Antes e Depois
              </a>
              <a href="#servicos" className="hover:text-slate-900 transition-colors">
                Serviços
              </a>
              <a href="#orcamento" className="hover:text-slate-900 transition-colors">
                Preços
              </a>
              <a href="#como-funciona" className="hover:text-slate-900 transition-colors">
                Como funciona
              </a>
              <a href="#confianca" className="hover:text-slate-900 transition-colors">
                Avaliações
              </a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">
                FAQ
              </a>
            </nav>

            {/* Zone 3: Primary Action */}
            <div className="flex items-center gap-2.5">
              <a
                href="#orcamento"
                onClick={() => sendAnalyticsEvent("orcamento_iniciado", { origem: "header" })}
                className="hidden sm:inline-flex min-h-11 items-center justify-center px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition shadow-soft whitespace-nowrap"
              >
                Pedir orçamento
              </a>

              <button
                id="mobileMenuBtn"
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center cursor-pointer"
                aria-label="Abrir menu"
              >
                {!mobileMenuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7h16M4 12h16M4 17h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div id="mobileMenu" className="lg:hidden pb-4">
              <nav className="bg-white rounded-2xl border border-slate-100 shadow-card p-3 flex flex-col gap-1">
                <a
                  href="#antes-depois"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Antes e Depois
                </a>
                <a
                  href="#servicos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Serviços
                </a>
                <a
                  href="#orcamento"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Preços
                </a>
                <a
                  href="#como-funciona"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Como funciona
                </a>
                <a
                  href="#confianca"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Avaliações
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Perguntas frequentes
                </a>
                <a
                  href="#orcamento"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    sendAnalyticsEvent("orcamento_iniciado", { origem: "header" });
                  }}
                  className="mt-2 py-3.5 text-center rounded-xl bg-brand-600 text-white font-bold"
                >
                  Pedir orçamento
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* =========================================================
            HERO
           ========================================================== */}
        <section
          id="inicio"
          className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden hero-grid"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-200/40 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-100/50 blur-3xl rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                {/* Live Availability Status */}
                <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-800 mb-6">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      businessStatus.open ? "bg-green-500 pulse-dot" : "bg-amber-500"
                    }`}
                  />
                  <span>
                    {businessStatus.open
                      ? businessStatus.message
                      : `${businessStatus.message} Deixe o pedido e respondemos primeiro.`}
                  </span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-slate-950">
                  A sua casa merece
                  <span className="gradient-text"> respirar limpeza.</span>
                </h1>

                <p className="mt-5 text-lg md:text-xl leading-relaxed text-slate-600 max-w-xl">
                  Higienizamos sofás, tapetes, colchões e interiores de carros para remover
                  sujidade, manchas e odores — com atendimento cómodo em Luanda.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#orcamento"
                    onClick={() => sendAnalyticsEvent("orcamento_iniciado", { origem: "hero" })}
                    className="min-h-12 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center justify-center gap-2 shadow-soft transition whitespace-nowrap"
                  >
                    <span>Pedir orçamento grátis</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>

                  <a
                    id="heroWhatsApp"
                    href={genericWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sendAnalyticsEvent("clique_whatsapp", { origem: "hero" })}
                    className="min-h-12 px-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 transition whitespace-nowrap"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M20 11.5A8 8 0 0 1 8.2 19L4 20l1.1-4.1A8 8 0 1 1 20 11.5Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M8.8 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.3.1.5-.1.7l-.5.6c.7 1.2 1.5 2 2.7 2.7l.6-.5c.2-.2.4-.2.7-.1l1.4.6c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1.3.3-2.4-.1-1.1-.4-2.3-1.2-3.4-2.3s-1.9-2.3-2.3-3.4c-.4-1.1-.3-2-.1-2.4Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>Falar no WhatsApp</span>
                  </a>
                </div>

                {/* Key Service Highlights */}
                <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl pt-6 border-t border-slate-200/70">
                  <div className="text-xs sm:text-sm text-slate-600">
                    <strong className="block text-slate-900 font-display">Garantia 48h</strong>
                    <span>Qualidade assegurada</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600">
                    <strong className="block text-slate-900 font-display">Ao domicílio</strong>
                    <span>Na sua comodidade</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600">
                    <strong className="block text-slate-900 font-display">Secagem rápida</strong>
                    <span>4–6 horas</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual Showcase */}
              <div className="relative">
                <div className="absolute -inset-5 bg-brand-100/70 rounded-[2rem] blur-2xl pointer-events-none" />

                <div className="image-placeholder relative aspect-[4/4.2] sm:aspect-[4/4] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src="/src/assets/images/hero_cleaning_pro_1791476568154.jpg"
                    alt="Profissional da Cleaning Angola a higienizar um sofá em Luanda"
                    width="1200"
                    height="1200"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover loaded"
                  />

                  <div className="absolute inset-x-4 bottom-4 glass rounded-2xl p-4 border border-white/70 shadow-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500 font-semibold">
                          Atendimento ao domicílio em
                        </div>
                        <div className="font-display font-extrabold text-slate-900">
                          Luanda, Angola · Respire Limpeza
                        </div>
                      </div>
                      <a
                        href="#antes-depois"
                        className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition whitespace-nowrap"
                      >
                        Ver resultados →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            ANTES / DEPOIS (INTERACTIVE TRANSFORMATION SHOWCASE)
           ========================================================== */}
        <BeforeAfterShowcase onSelectServiceForQuote={handleSelectServiceFromPage} />

        {/* =========================================================
            SERVIÇOS
           ========================================================== */}
        <section id="servicos" className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
              <div>
                <span className="text-brand-700 font-bold text-sm uppercase tracking-widest">
                  O que limpamos
                </span>
                <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-slate-950">
                  Serviços profissionais
                </h2>
              </div>
              <p className="text-slate-600 max-w-md">
                Escolha o serviço, indique o tamanho e receba uma estimativa imediata em poucos segundos.
              </p>
            </div>

            <div id="servicesGrid" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SERVICES.map((service, idx) => {
                const startingPrice = service.starting();
                return (
                  <article
                    key={service.id}
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-card group flex flex-col"
                  >
                    <div className="image-placeholder aspect-[16/10] overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.name}
                        width="800"
                        height="500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 loaded"
                      />
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                          <ServiceSvgIcon icon={service.icon} />
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          0{idx + 1}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-display font-extrabold text-slate-900">
                        {service.name}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-slate-500 flex-1">
                        {service.description}
                      </p>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-400 font-semibold">A partir de</div>
                          <div className="text-lg font-display font-extrabold text-slate-900 tabular-nums">
                            {startingPrice ? formatMoney(startingPrice) : "Consultar"}
                          </div>
                        </div>

                        <a
                          href="#orcamento"
                          onClick={() => handleSelectServiceFromPage(service.id)}
                          className="text-sm font-bold text-brand-700 hover:text-brand-900 transition whitespace-nowrap"
                        >
                          Ver preço →
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            ORÇAMENTO INSTANTÂNEO (4-STEP INTERACTIVE WIZARD)
           ========================================================== */}
        <section id="orcamento" className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-brand-700 font-bold text-xs uppercase tracking-widest">
                Orçamento em menos de 1 minuto
              </span>
              <h2 className="mt-3 text-3xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950">
                Saiba quanto pode custar
              </h2>
              <p className="mt-4 text-slate-600 max-w-xl mx-auto">
                Responda a 4 passos rápidos. No final, confirmamos tudo consigo pelo WhatsApp.
              </p>
            </div>

            {/* Saved Progress Banner */}
            {showSavedBanner && savedQuoteSnapshot && (
              <div
                id="savedProgress"
                className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-brand-700 flex items-center justify-center shrink-0">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-bold text-slate-900">
                      Continuar de onde ficaste?
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      Encontrámos um orçamento que ainda não terminaste.
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQuoteState(savedQuoteSnapshot);
                          setShowSavedBanner(false);
                          showToast("Progresso restaurado.");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold cursor-pointer"
                      >
                        Continuar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          clearQuoteStorage();
                          setQuoteState(DEFAULT_QUOTE_STATE);
                          setCompletedSteps([]);
                          setShowSavedBanner(false);
                          showToast("Começámos um novo orçamento.");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold cursor-pointer"
                      >
                        Recomeçar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div
              id="quoteApp"
              className="rounded-[2rem] border border-slate-200 shadow-card overflow-hidden bg-white"
            >
              {/* Progress Bar Header */}
              <div className="px-5 sm:px-7 pt-6 pb-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span id="stepLabel" className="text-sm font-bold text-slate-700">
                    {quoteCompleted ? "Orçamento concluído" : `Passo ${quoteState.step} de 4`}
                  </span>
                  <span
                    id="stepPercent"
                    className="text-xs font-mono font-semibold text-slate-500 tabular-nums"
                  >
                    {quoteCompleted ? "100%" : `${quoteState.step * 25}%`}
                  </span>
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    id="progressLine"
                    className="progress-line h-full bg-brand-600 rounded-full"
                    style={{ width: quoteCompleted ? "100%" : `${quoteState.step * 25}%` }}
                  />
                </div>

                <div className="mt-4 flex justify-between">
                  {[1, 2, 3, 4].map((stepNum) => {
                    const isCompleted = quoteCompleted || completedSteps.includes(stepNum) || stepNum < quoteState.step;
                    const isActive = stepNum <= quoteState.step || quoteCompleted;
                    return (
                      <button
                        key={stepNum}
                        type="button"
                        disabled={stepNum > quoteState.step && !isCompleted}
                        onClick={() => {
                          if (stepNum < quoteState.step || isCompleted) {
                            goToStep(stepNum, "back");
                          }
                        }}
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition ${
                          isActive
                            ? "bg-brand-600 text-white cursor-pointer"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isCompleted && stepNum < quoteState.step ? (
                          <svg
                            className="check-draw animate"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M5 12l4 4L19 6"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          stepNum
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step Screens */}
              <div className="p-5 sm:p-8">
                {/* STEP 1 */}
                {!quoteCompleted && quoteState.step === 1 && (
                  <div className="step-screen">
                    <div className="mb-6">
                      <div className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                        Passo 1
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900">
                        O que quer limpar?
                      </h3>
                      <p className="mt-2 text-slate-500">
                        Escolha o serviço que pretende solicitar.
                      </p>
                    </div>

                    <div id="serviceChoices" className="grid sm:grid-cols-2 gap-3">
                      {SERVICES.map((service) => {
                        const selected = quoteState.service === service.id;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setQuoteState((prev) => {
                                const next: QuoteState = {
                                  ...prev,
                                  service: service.id,
                                  size: ""
                                };
                                saveQuoteToStorage(next);
                                return next;
                              });
                            }}
                            className={`choice-card ${
                              selected ? "selected" : ""
                            } relative text-left rounded-2xl border-2 ${
                              selected
                                ? "border-brand-600 bg-brand-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            } p-4 min-h-[100px] cursor-pointer`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-11 h-11 rounded-xl ${
                                  selected
                                    ? "bg-white text-brand-700"
                                    : "bg-slate-50 text-slate-600"
                                } flex items-center justify-center shrink-0`}
                              >
                                <ServiceSvgIcon icon={service.icon} />
                              </div>

                              <div className="flex-1">
                                <div className="font-display font-extrabold text-slate-900">
                                  {service.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {service.description}
                                </div>
                              </div>

                              <span className="choice-check w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="M5 12l4 4L19 6"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      id="nextStep1"
                      type="button"
                      disabled={!quoteState.service}
                      onClick={() => {
                        if (!quoteState.service) return;
                        sendAnalyticsEvent("passo_concluido", { passo: 1 });
                        goToStep(2, "forward");
                      }}
                      className="mt-6 w-full min-h-12 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {/* STEP 2 */}
                {!quoteCompleted && quoteState.step === 2 && (
                  <div className="step-screen">
                    <div className="mb-6">
                      <div className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                        Passo 2
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900">
                        {quoteState.service === "carpet"
                          ? "Qual o tamanho do tapete?"
                          : "Qual o tamanho / tipo?"}
                      </h3>
                      <p className="mt-2 text-slate-500">
                        Escolha a opção que mais se aproxima do seu caso.
                      </p>
                    </div>

                    <div id="sizeChoices" className="grid sm:grid-cols-2 gap-3">
                      {getSizeOptions(quoteState.service).map((option) => {
                        const selected = quoteState.size === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setQuoteState((prev) => {
                                const next = { ...prev, size: option.key };
                                saveQuoteToStorage(next);
                                return next;
                              });
                            }}
                            className={`choice-card ${
                              selected ? "selected" : ""
                            } relative text-left rounded-2xl border-2 ${
                              selected
                                ? "border-brand-600 bg-brand-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            } p-5 min-h-[85px] cursor-pointer`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-display font-extrabold text-slate-900">
                                  {option.label}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 tabular-nums">
                                  {option.price
                                    ? `A partir de ${formatMoney(option.price)}`
                                    : "Preço a confirmar"}
                                </div>
                              </div>

                              <span className="choice-check w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="M5 12l4 4L19 6"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => goToStep(1, "back")}
                        className="w-1/3 min-h-12 py-3.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        id="nextStep2"
                        type="button"
                        disabled={!quoteState.size}
                        onClick={() => {
                          if (!quoteState.size) return;
                          sendAnalyticsEvent("passo_concluido", { passo: 2 });
                          goToStep(3, "forward");
                        }}
                        className="w-2/3 min-h-12 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {!quoteCompleted && quoteState.step === 3 && (
                  <div className="step-screen">
                    <div className="mb-6">
                      <div className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                        Passo 3
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900">
                        Qual é o estado?
                      </h3>
                      <p className="mt-2 text-slate-500">
                        Pode selecionar mais do que uma opção para ajustar a estimativa.
                      </p>
                    </div>

                    <div id="conditionChoices" className="grid sm:grid-cols-2 gap-3">
                      {[
                        {
                          key: "light",
                          label: "Manchas leves",
                          description: "Sujidade normal do uso diário.",
                          tag: "Sem custo extra"
                        },
                        {
                          key: "strongStains",
                          label: "Manchas fortes",
                          description: "Manchas visíveis ou antigas.",
                          tag: `+${CONFIG.prices.extras.strongStains.value}%`
                        },
                        {
                          key: "odor",
                          label: "Mau cheiro",
                          description: "Precisa de tratamento bactericida de odor.",
                          tag: `+${formatMoney(CONFIG.prices.extras.odor.value)}`
                        },
                        {
                          key: "petHair",
                          label: "Pelos de animais",
                          description: "Remoção detalhada de pelos aderidos.",
                          tag: `+${formatMoney(CONFIG.prices.extras.petHair.value)}`
                        }
                      ].map((option) => {
                        const selected = quoteState.conditions.includes(option.key);
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleToggleCondition(option.key)}
                            className={`choice-card ${
                              selected ? "selected" : ""
                            } relative text-left rounded-2xl border-2 ${
                              selected
                                ? "border-brand-600 bg-brand-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            } p-4 min-h-[88px] cursor-pointer`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-extrabold text-slate-900">
                                    {option.label}
                                  </span>
                                  <span className="text-xs font-mono text-brand-700 font-semibold">
                                    {option.tag}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {option.description}
                                </div>
                              </div>

                              <span className="choice-check w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="M5 12l4 4L19 6"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-500 font-semibold">
                            Estimativa atual (a partir de)
                          </div>
                          <div
                            id="livePriceStep3"
                            className={`mt-1 text-2xl font-display font-extrabold text-slate-900 tabular-nums ${
                              pricePulse ? "price-pulse" : ""
                            }`}
                          >
                            {displayedPrice ? formatMoney(displayedPrice) : "A definir"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Variação</div>
                          <div
                            id="priceReasonStep3"
                            className="text-xs font-semibold text-brand-700"
                          >
                            {currentEstimate.reason}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => goToStep(2, "back")}
                        className="w-1/3 min-h-12 py-3.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        id="nextStep3"
                        type="button"
                        onClick={() => {
                          sendAnalyticsEvent("passo_concluido", { passo: 3 });
                          goToStep(4, "forward");
                        }}
                        className="w-2/3 min-h-12 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition cursor-pointer"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {!quoteCompleted && quoteState.step === 4 && (
                  <div className="step-screen">
                    <div className="mb-6">
                      <div className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                        Passo 4
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900">
                        Quando e onde?
                      </h3>
                      <p className="mt-2 text-slate-500">
                        Preencha os dados para confirmarmos o agendamento consigo.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="customerName"
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          Nome
                        </label>
                        <input
                          id="customerName"
                          type="text"
                          autoComplete="name"
                          value={quoteState.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteState((prev) => {
                              const next = { ...prev, name: val };
                              saveQuoteToStorage(next);
                              return next;
                            });
                          }}
                          placeholder="Ex.: João Manuel"
                          className="w-full min-h-12 py-3 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="customerZone"
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          Zona / bairro em Luanda
                        </label>
                        <input
                          id="customerZone"
                          type="text"
                          list="luanda-zones"
                          value={quoteState.zone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteState((prev) => {
                              const next = { ...prev, zone: val };
                              saveQuoteToStorage(next);
                              return next;
                            });
                          }}
                          placeholder="Ex.: Talatona"
                          className="w-full min-h-12 py-3 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                        />
                        <datalist id="luanda-zones">
                          {CONFIG.company.zones.map((z) => (
                            <option key={z} value={z} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label
                          htmlFor="customerDate"
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          Dia preferido
                        </label>
                        <input
                          id="customerDate"
                          type="date"
                          min={todayIso}
                          value={quoteState.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteState((prev) => {
                              const next = { ...prev, date: val };
                              saveQuoteToStorage(next);
                              return next;
                            });
                          }}
                          className="w-full min-h-12 py-3 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="customerTime"
                          className="block text-sm font-bold text-slate-700 mb-2"
                        >
                          Hora preferida
                        </label>
                        <select
                          id="customerTime"
                          value={quoteState.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteState((prev) => {
                              const next = { ...prev, time: val };
                              saveQuoteToStorage(next);
                              return next;
                            });
                          }}
                          className="w-full min-h-12 py-3 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 bg-white"
                        >
                          <option value="">Escolher horário</option>
                          {[
                            "08:00",
                            "09:00",
                            "10:00",
                            "11:00",
                            "12:00",
                            "13:00",
                            "14:00",
                            "15:00",
                            "16:00",
                            "17:00"
                          ].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Final Price Summary Box */}
                    <div className="mt-6 p-5 rounded-2xl bg-brand-50 border border-brand-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white text-brand-700 flex items-center justify-center shrink-0">
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 3v18M3 12h18"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-brand-700">
                            Estimativa para {getServiceName(quoteState.service)} ({getSizeName(quoteState.service, quoteState.size)})
                          </div>
                          <div
                            id="finalPriceRange"
                            className="text-2xl font-display font-extrabold text-brand-900 mt-1 tabular-nums"
                          >
                            {formatRange(currentEstimate.min, currentEstimate.max)}
                          </div>
                          <div id="finalPriceReason" className="text-sm text-brand-700 mt-1">
                            {currentEstimate.reason}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Business Attendance Notice */}
                    <div
                      id="quoteStatus"
                      className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 p-4"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          businessStatus.open ? "bg-green-500 pulse-dot" : "bg-amber-500"
                        }`}
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {businessStatus.open
                            ? `Estamos online — resposta em cerca de ${CONFIG.company.responseTime}.`
                            : businessStatus.message}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {businessStatus.open
                            ? "Envie o pedido agora e confirmamos os detalhes pelo WhatsApp."
                            : "Pode deixar o pedido agora. A equipa responderá assim que estiver disponível."}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => goToStep(3, "back")}
                        className="w-1/3 min-h-12 py-3.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition cursor-pointer"
                      >
                        Voltar
                      </button>

                      {isStep4Complete ? (
                        <a
                          id="confirmQuote"
                          href={getWhatsAppUrl(buildQuoteMessage())}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleConfirmQuote()}
                          className="w-2/3 min-h-12 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center justify-center gap-2 shadow-soft transition"
                        >
                          <span>Confirmar no WhatsApp</span>
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 12h14M13 6l6 6-6 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      ) : (
                        <button
                          id="confirmQuote"
                          type="button"
                          disabled
                          className="w-2/3 min-h-12 py-3.5 rounded-xl bg-slate-200 text-slate-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <span>Confirmar no WhatsApp</span>
                        </button>
                      )}
                    </div>

                    <p className="mt-3 text-center text-xs text-slate-400">
                      Depois de abrir o WhatsApp, envie 2 ou 3 fotos do serviço para confirmarmos o valor final.
                    </p>
                  </div>
                )}

                {/* FINAL SUCCESS SCREEN */}
                {quoteCompleted && (
                  <div id="quoteSuccess" className="text-center py-8 step-screen">
                    <div className="mx-auto w-20 h-20 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">
                      <svg
                        className="check-draw animate"
                        width="42"
                        height="42"
                        viewBox="0 0 42 42"
                        fill="none"
                      >
                        <path
                          d="M10 22l8 8 15-18"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <h3 className="mt-6 text-3xl font-display font-extrabold text-slate-900">
                      Pedido preparado!
                    </h3>

                    <p className="mt-3 text-slate-600 max-w-md mx-auto">
                      O WhatsApp foi aberto com os seus dados. Agora envie{" "}
                      <strong>2 ou 3 fotos</strong> para recebermos o pedido e confirmarmos o orçamento.
                    </p>

                    <div className="mt-7 p-5 rounded-2xl bg-slate-50 text-left max-w-md mx-auto border border-slate-100">
                      <div className="font-bold text-slate-900">
                        Para acelerar a confirmação:
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        <li className="flex gap-2">
                          <span className="text-brand-600 font-bold">✓</span>
                          <span>Uma foto geral do item.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-brand-600 font-bold">✓</span>
                          <span>Uma foto aproximada das manchas.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-brand-600 font-bold">✓</span>
                          <span>Se possível, uma foto de outro ângulo.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        id="successWhatsApp"
                        href={lastQuoteWhatsAppUrl || genericWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          sendAnalyticsEvent("clique_whatsapp", { origem: "orçamento" })
                        }
                        className="inline-flex min-h-12 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold items-center justify-center gap-2 transition"
                      >
                        Abrir WhatsApp novamente
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setQuoteCompleted(false);
                          setQuoteState(DEFAULT_QUOTE_STATE);
                          setCompletedSteps([]);
                        }}
                        className="inline-flex min-h-12 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold items-center justify-center transition cursor-pointer"
                      >
                        Fazer nova estimativa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            COMO FUNCIONA
           ========================================================== */}
        <section id="como-funciona" className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-brand-700 font-bold text-sm uppercase tracking-widest">
                Sem complicações
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-slate-950">
                Como funciona
              </h2>
              <p className="mt-4 text-slate-600">
                Do primeiro contacto ao sofá limpo, o processo é simples e transparente.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  num: "01",
                  title: "Pedes orçamento",
                  desc: "Preenches o orçamento rápido em 1 minuto e envias fotos pelo WhatsApp.",
                  icon: (
                    <path
                      d="M5 5h14v10H5zM8 19h8M12 15v4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )
                },
                {
                  num: "02",
                  title: "Confirmamos",
                  desc: "Analisamos as fotos, confirmamos o preço fechado e combinamos o horário.",
                  icon: (
                    <path
                      d="M5 12l4 4L19 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )
                },
                {
                  num: "03",
                  title: "Limpamos",
                  desc: "A nossa equipa desloca-se até si e realiza a higienização com cuidado e técnica.",
                  icon: (
                    <path
                      d="M4 14c2-4 4-6 8-6s6 2 8 6M7 17h10M9 20h6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  )
                },
                {
                  num: "04",
                  title: "Aprovas",
                  desc: "Vês o resultado na hora, confirmas o serviço e voltas a desfrutar do espaço.",
                  icon: (
                    <path
                      d="M3 12l5 5L21 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )
                }
              ].map((step) => (
                <div
                  key={step.num}
                  className="relative bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card"
                >
                  <div className="text-xs font-mono font-extrabold text-brand-600">
                    {step.num}
                  </div>
                  <div className="mt-5 w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
                      {step.icon}
                    </svg>
                  </div>
                  <h3 className="mt-5 font-display font-extrabold text-lg text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            PACOTES E PROMOÇÕES
           ========================================================== */}
        <section id="pacotes" className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-brand-700 font-bold text-sm uppercase tracking-widest">
                Poupe mais
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-slate-950">
                Pacotes e promoções
              </h2>
              <p className="mt-4 text-slate-600">
                Combine serviços na mesma deslocação e aproveite condições especiais.
              </p>
            </div>

            <div id="packagesGrid" className="grid md:grid-cols-3 gap-5">
              {CONFIG.prices.packages.map((pkg) => (
                <article
                  key={pkg.name}
                  className={`relative rounded-3xl border p-6 shadow-card flex flex-col ${
                    pkg.popular
                      ? "border-brand-500 bg-brand-50/70"
                      : "border-slate-200/80 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl ${
                        pkg.popular
                          ? "bg-white text-brand-700"
                          : "bg-brand-50 text-brand-700"
                      } flex items-center justify-center`}
                    >
                      <ServiceSvgIcon icon={pkg.icon} />
                    </div>
                    {pkg.popular && (
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                        Mais popular
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-display font-extrabold text-slate-900">
                    {pkg.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 flex-1">{pkg.description}</p>

                  <div className="mt-5 text-sm font-bold text-brand-700 tabular-nums">
                    Desconto imediato de -{pkg.discount}% no pacote
                  </div>

                  <a
                    href="#orcamento"
                    onClick={() => handleSelectServiceFromPage(pkg.serviceId)}
                    className={`mt-6 w-full min-h-11 rounded-xl ${
                      pkg.popular
                        ? "bg-brand-600 hover:bg-brand-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    } flex items-center justify-center font-bold text-sm transition`}
                  >
                    Pedir orçamento
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            CONFIANÇA & AVALIAÇÕES
           ========================================================== */}
        <section id="confianca" className="py-16 md:py-24 bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-12 items-center">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-brand-300">
                  Compromisso com a qualidade
                </div>

                <h2 className="mt-4 text-3xl md:text-5xl font-display font-extrabold leading-tight">
                  Limpeza que se nota.{" "}
                  <span className="text-brand-300">Cuidado que se sente.</span>
                </h2>

                <p className="mt-5 text-slate-300 leading-relaxed max-w-lg">
                  Trabalhamos com produtos biodegradáveis e extração profissional para devolver aos seus espaços uma sensação de frescura, conforto e saúde.
                </p>

                <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 3l7 3v5c0 4.7-3 8.5-7 10-4-1.5-7-5.3-7-10V6l7-3Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M8 12l2.5 2.5L16 9"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-white">
                        Garantia de serviço 48h
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        Não ficou bom? Voltamos sem custo adicional em até 48 horas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid sm:grid-cols-3 gap-4 mb-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-3xl font-display font-extrabold tabular-nums">
                      250+
                    </div>
                    <div className="mt-1 text-sm text-slate-400">Clientes atendidos em Luanda</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-3xl font-display font-extrabold tabular-nums">
                      4,9/5
                    </div>
                    <div className="mt-1 text-sm text-slate-400">Avaliação média verificada</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-3xl font-display font-extrabold tabular-nums">
                      4–6h
                    </div>
                    <div className="mt-1 text-sm text-slate-400">Tempo médio de secagem</div>
                  </div>
                </div>

                <div id="testimonialsGrid" className="grid sm:grid-cols-3 gap-4">
                  {CONFIG.testimonials.map((t) => (
                    <article
                      key={t.name}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col"
                    >
                      <div className="flex gap-1 text-amber-300">
                        {Array.from({ length: t.rating }).map((_, idx) => (
                          <svg
                            key={idx}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 3l2.2 5.1 5.5.5-4.2 3.6 1.3 5.4L12 15l-4.8 2.6 1.3-5.4-4.2-3.6 5.5-.5L12 3Z" />
                          </svg>
                        ))}
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-slate-300 flex-1">
                        “{t.text}”
                      </p>
                      <div className="mt-5 pt-3 border-t border-white/10">
                        <div className="text-sm font-bold text-white">{t.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {t.service} · {t.zone}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            ZONAS ATENDIDAS
           ========================================================== */}
        <section id="zonas" className="py-16 md:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              <span className="text-brand-700 font-bold text-sm uppercase tracking-widest">
                Onde estamos
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-slate-950">
                Zonas atendidas em Luanda
              </h2>
              <p className="mt-4 text-slate-600">
                Selecione a sua zona para iniciar o orçamento ou confirme a disponibilidade no WhatsApp.
              </p>
            </div>

            <div
              id="zonesGrid"
              className="mt-8 flex flex-wrap justify-center gap-2.5"
            >
              {CONFIG.company.zones.map((zone) => {
                const isSelectedZone = quoteState.zone === zone;
                return (
                  <a
                    key={zone}
                    href="#orcamento"
                    onClick={() => {
                      setQuoteState((prev) => {
                        const next = { ...prev, zone };
                        saveQuoteToStorage(next);
                        return next;
                      });
                      showToast(`Zona selecionada: ${zone}`);
                    }}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                      isSelectedZone
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700"
                    }`}
                  >
                    {zone}
                  </a>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl bg-brand-50 border border-brand-100 p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-brand-700 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 12h18M13 5l7 7-7 7M3 5v14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="font-bold text-slate-900">Recolha e entrega de tapetes</div>
                <div className="text-sm text-slate-600 mt-1">
                  Disponibilidade de recolha e entrega:{" "}
                  <strong id="pickupText" className="text-brand-800">
                    {CONFIG.company.pickupDelivery ? "disponível sob agendamento" : "não disponível"}
                  </strong>
                  .
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FAQ
           ========================================================== */}
        <section id="faq" className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-brand-700 font-bold text-sm uppercase tracking-widest">
                Dúvidas?
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-slate-950">
                Perguntas frequentes
              </h2>
            </div>

            <div id="faqList" className="space-y-3">
              {CONFIG.faq.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <article
                    key={item.q}
                    className={`faq bg-white border border-slate-200 rounded-2xl overflow-hidden ${
                      isOpen ? "open" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between gap-4 text-left p-5 cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="font-display font-bold text-slate-900">
                        {item.q}
                      </span>
                      <span className="faq-icon w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </button>

                    <div className="faq-answer">
                      <div>
                        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            CTA FINAL
           ========================================================== */}
        <section id="cta-final" className="py-16 md:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-brand-700 p-8 md:p-14 text-white text-center">
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-black/10 pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-100">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      businessStatus.open ? "bg-green-400 pulse-dot" : "bg-amber-400"
                    }`}
                  />
                  <span>{businessStatus.message}</span>
                </div>

                <h2 className="mt-4 text-3xl md:text-5xl font-display font-extrabold">
                  Pronto para voltar a respirar limpeza?
                </h2>

                <p className="mt-4 text-brand-50 max-w-xl mx-auto">
                  Faça uma estimativa gratuita agora e confirme tudo pelo WhatsApp.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="#orcamento"
                    onClick={() => sendAnalyticsEvent("orcamento_iniciado", { origem: "final" })}
                    className="min-h-12 px-7 rounded-xl bg-white text-brand-800 font-bold flex items-center justify-center gap-2 hover:bg-brand-50 transition whitespace-nowrap"
                  >
                    Pedir orçamento grátis
                  </a>

                  <a
                    id="finalWhatsApp"
                    href={genericWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sendAnalyticsEvent("clique_whatsapp", { origem: "final" })}
                    className="min-h-12 px-7 rounded-xl bg-brand-900/50 border border-white/20 text-white font-bold flex items-center justify-center gap-2 hover:bg-brand-900 transition whitespace-nowrap"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            OWNER RESULTS DASHBOARD (Accessible via Footer "Área de resultados")
           ========================================================== */}
        {showOwnerDashboard && (
          <section id="resultados" className="py-16 bg-slate-100 border-t border-slate-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-brand-700 font-bold text-sm uppercase tracking-widest">
                    Área do dono
                  </span>
                  <h2 className="mt-2 text-3xl font-display font-extrabold text-slate-900">
                    Resultados e Conversão
                  </h2>
                  <p className="mt-2 text-slate-600 text-sm">
                    Dados guardados localmente neste navegador.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!confirmingReset ? (
                    <button
                      id="resetAnalytics"
                      type="button"
                      onClick={() => setConfirmingReset(true)}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Limpar dados
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-red-200">
                      <button
                        type="button"
                        onClick={() => {
                          setAnalyticsData(DEFAULT_ANALYTICS);
                          try {
                            localStorage.removeItem(CONFIG.analyticsStorageKey);
                          } catch {
                            // Ignore
                          }
                          setConfirmingReset(false);
                          showToast("Resultados limpos.");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Confirmar limpeza
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingReset(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowOwnerDashboard(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-300 cursor-pointer"
                  >
                    Fechar painel
                  </button>
                </div>
              </div>

              <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="text-xs font-bold text-slate-500 uppercase">WhatsApp</div>
                  <div className="mt-2 text-3xl font-display font-extrabold tabular-nums">
                    {analyticsData.whatsapp}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="text-xs font-bold text-slate-500 uppercase">Iniciados</div>
                  <div className="mt-2 text-3xl font-display font-extrabold tabular-nums">
                    {analyticsData.started}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="text-xs font-bold text-slate-500 uppercase">Concluídos</div>
                  <div className="mt-2 text-3xl font-display font-extrabold tabular-nums">
                    {analyticsData.completed}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    Taxa de conclusão
                  </div>
                  <div className="mt-2 text-3xl font-display font-extrabold tabular-nums">
                    {completionRate}%
                  </div>
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="font-display font-extrabold text-slate-900">
                    Origem dos cliques
                  </div>
                  <div className="mt-4 space-y-3">
                    {sortedSources.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Ainda não existem cliques registados.
                      </div>
                    ) : (
                      sortedSources.map(([source, count]) => (
                        <div
                          key={source}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <span className="font-semibold capitalize text-slate-700">
                            {source}
                          </span>
                          <span className="font-mono font-bold text-brand-700 tabular-nums">
                            {count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="font-display font-extrabold text-slate-900">
                    Botão que mais converte
                  </div>
                  <div className="mt-2 text-slate-600 text-sm">
                    {sortedSources.length > 0
                      ? `${sortedSources[0][0]} — ${sortedSources[0][1]} clique(s)`
                      : "Ainda sem dados."}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="font-display font-bold text-sm text-slate-900">
                      Estado de Analytics Externo
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {CONFIG.analytics.googleAnalyticsId || CONFIG.analytics.plausibleDomain
                        ? "Google Analytics / Plausible configurado."
                        : "Modo de contagem local ativo (edite src/config.ts para ligar GA4 ou Plausible)."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =========================================================
          FOOTER
         ========================================================== */}
      <footer className="bg-slate-950 text-white pt-12 pb-28 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3C12 3 6 9.1 6 14.2A6 6 0 0 0 18 14.2C18 9.1 12 3 12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M9.5 15.5C10.1 17 11.1 17.8 12.8 18"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-display font-extrabold text-lg">
                    {CONFIG.company.name}
                  </div>
                  <div className="text-xs text-brand-300">{CONFIG.company.slogan}</div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-400 max-w-md">
                Limpeza e higienização profissional de sofás, tapetes, colchões e interiores de carros em Luanda.
              </p>

              <div className="mt-5 flex gap-3">
                <a
                  id="footerWhatsApp"
                  href={genericWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sendAnalyticsEvent("clique_whatsapp", { origem: "footer" })}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                  aria-label="WhatsApp"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 11.5A8 8 0 0 1 8.2 19L4 20l1.1-4.1A8 8 0 1 1 20 11.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M8.8 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.3.1.5-.1.7l-.5.6c.7 1.2 1.5 2 2.7 2.7l.6-.5c.2-.2.4-.2.7-.1l1.4.6c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1.3.3-2.4-.1-1.1-.4-2.3-1.2-3.4-2.3s-1.9-2.3-2.3-3.4c-.4-1.1-.3-2-.1-2.4Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>

                <a
                  id="footerInstagram"
                  href={CONFIG.company.instagramUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                  aria-label="Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="17.3" cy="6.8" r="1" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold">Contactos</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <a
                  id="footerPhone"
                  href={`tel:${normalizePhone(CONFIG.company.whatsapp)}`}
                  className="block hover:text-white transition"
                >
                  {CONFIG.company.whatsapp}
                </a>
                <div id="footerLocation">
                  {CONFIG.company.city}, {CONFIG.company.country}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold">Horário</h3>
              <div className="mt-4 text-sm text-slate-400">
                <div id="footerHours">Seg–Sáb, 8h–18h</div>
                <div id="footerResponse" className="mt-2">
                  Resposta em cerca de {CONFIG.company.responseTime}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} {CONFIG.company.name}. Todos os direitos reservados.
            </div>
            <button
              type="button"
              onClick={() => {
                setShowOwnerDashboard((v) => !v);
                window.setTimeout(() => {
                  document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" });
                }, 80);
              }}
              className="hover:text-slate-300 text-left sm:text-right cursor-pointer"
            >
              Área de resultados
            </button>
          </div>
        </div>
      </footer>

      {/* =========================================================
          FLOATING WHATSAPP BUTTON
         ========================================================== */}
      {visibleSection !== "orcamento" && (
        <a
          id="floatingWhatsApp"
          href={genericWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendAnalyticsEvent("clique_whatsapp", { origem: "flutuante" })}
          className="whatsapp-pulse fixed z-[60] right-4 bottom-[88px] md:bottom-5 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl"
          aria-label="Falar no WhatsApp"
        >
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 11.5A8 8 0 0 1 8.2 19L4 20l1.1-4.1A8 8 0 1 1 20 11.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M8.8 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.3.1.5-.1.7l-.5.6c.7 1.2 1.5 2 2.7 2.7l.6-.5c.2-.2.4-.2.7-.1l1.4.6c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1.3.3-2.4-.1-1.1-.4-2.3-1.2-3.4-2.3s-1.9-2.3-2.3-3.4c-.4-1.1-.3-2-.1-2.4Z"
              fill="currentColor"
            />
          </svg>
        </a>
      )}

      {/* =========================================================
          MOBILE SMART ACTION BAR
         ========================================================== */}
      <div
        id="mobileActionBar"
        className={`mobile-action md:hidden fixed z-[55] bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 pt-2 ${
          keyboardOpen ? "hidden-by-keyboard" : ""
        }`}
      >
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <div className="hidden sm:block flex-1 pl-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Atalho
            </div>
            <div className="text-xs font-semibold text-slate-700">{mobileAction.hint}</div>
          </div>

          {mobileAction.action === "success" ? (
            <a
              href={lastQuoteWhatsAppUrl || genericWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-12 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              {mobileAction.text}
            </a>
          ) : (
            <button
              id="mobileActionBtn"
              type="button"
              onClick={handleMobileActionClick}
              className="flex-1 min-h-12 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {mobileAction.text}
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          TOAST NOTIFICATION
         ========================================================== */}
      <div
        id="toast"
        className={`toast fixed z-[100] left-1/2 bottom-24 bg-slate-950 text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${
          toastMessage ? "show" : ""
        }`}
      >
        {toastMessage || "Guardado."}
      </div>
    </div>
  );
}
