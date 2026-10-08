export interface StainZone {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rx: number;
  ry: number;
  rotation: number;
  color: string;
  opacity: number;
  label: string;
  detail: string;
}

export interface ComparisonItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  serviceId: "sofa" | "carpet" | "car" | "mattress";
  image: string;
  metrics: {
    stainRemoval: string;
    odorElimination: string;
    dryingTime: string;
  };
  beforeNotes: string;
  afterNotes: string;
  stains: StainZone[];
}

export const CONFIG = {
  company: {
    name: "Cleaning Angola",
    slogan: "Respire Limpeza",
    city: "Luanda",
    country: "Angola",
    whatsapp: "+244 940 682 684",
    whatsappLink: "https://wa.me/message/6J67F6GSQU2ME1",
    instagram: "@cleaningangola",
    instagramUrl: "https://instagram.com",
    timezone: "Africa/Luanda",
    responseTime: "5 min",
    pickupDelivery: true,
    atendimento: "Ao domicílio",
    dryingTime: "4 a 6 horas",
    guarantee: "Não ficou bom? Voltamos sem custo em 48h",
    zones: [
      "Talatona",
      "Maianga",
      "Alvalade",
      "Viana",
      "Kilamba",
      "Benfica",
      "Morro Bento",
      "Ingombota",
      "Cacuaco"
    ]
  },

  schedule: {
    1: { open: "08:00", close: "18:00" },
    2: { open: "08:00", close: "18:00" },
    3: { open: "08:00", close: "18:00" },
    4: { open: "08:00", close: "18:00" },
    5: { open: "08:00", close: "18:00" },
    6: { open: "08:00", close: "18:00" }
  } as Record<number, { open: string; close: string } | undefined>,

  prices: {
    sofa: {
      "2": {
        label: "2 lugares",
        min: 15000,
        max: 20000
      },
      "3": {
        label: "3 lugares",
        min: 22000,
        max: 28000
      },
      "4plus": {
        label: "4+ lugares / canto",
        min: 32000,
        max: 45000
      }
    } as Record<string, { label: string; min: number; max: number }>,

    carpet: {
      m2: {
        label: "Tapete pequeno / por m²",
        min: 12000,
        max: 18000
      },
      medium: {
        label: "Tapete médio (sala)",
        min: 18000,
        max: 25000
      },
      large: {
        label: "Tapete grande (3m+)",
        min: 26000,
        max: 35000
      }
    } as Record<string, { label: string; min: number; max: number }>,

    car: {
      small: {
        label: "Carro pequeno (Ligeiro)",
        min: 20000,
        max: 26000
      },
      suv: {
        label: "SUV / Monovolume",
        min: 28000,
        max: 36000
      },
      complete: {
        label: "Completo — estofos + tetos + mala",
        min: 36000,
        max: 48000
      }
    } as Record<string, { label: string; min: number; max: number }>,

    mattress: {
      single: {
        label: "Solteiro",
        min: 14000,
        max: 18000
      },
      double: {
        label: "Casal Padrão",
        min: 20000,
        max: 26000
      },
      king: {
        label: "Queen / King Size",
        min: 26000,
        max: 34000
      }
    } as Record<string, { label: string; min: number; max: number }>,

    extras: {
      strongStains: {
        label: "Manchas fortes",
        type: "percent" as const,
        value: 15
      },
      odor: {
        label: "Remoção de cheiro",
        type: "fixed" as const,
        value: 4000
      },
      petHair: {
        label: "Pelos de animais",
        type: "fixed" as const,
        value: 3500
      }
    },

    packages: [
      {
        name: "Casa Fresca",
        description: "Sofá 3 lugares + Tapete de sala com higienização completa.",
        discount: 10,
        popular: true,
        icon: "home",
        serviceId: "sofa" as const
      },
      {
        name: "Carro Renovado",
        description: "Interior completo: bancos, quartelas, teto e higienização A/C.",
        discount: 8,
        popular: false,
        icon: "car",
        serviceId: "car" as const
      },
      {
        name: "Sono Limpo",
        description: "Colchão de casal + Sofá higienizados contra ácaros e odores.",
        discount: 10,
        popular: false,
        icon: "bed",
        serviceId: "mattress" as const
      }
    ]
  },

  comparisons: [
    {
      id: "sofa",
      title: "Sofá de Linho",
      subtitle: "Higienização profunda por extração",
      description: "Remoção de manchas escuras de uso diário, auréolas de líquidos e poeira acumulada na espuma.",
      serviceId: "sofa",
      image: "/src/assets/images/sofa_clean_after_1791476578984.jpg",
      metrics: {
        stainRemoval: "99% manchas removidas",
        odorElimination: "Neutralização bacteriana",
        dryingTime: "Secagem: 4h"
      },
      beforeNotes: "Tecido acinzentado com manchas de café, gordura nas zonas de apoio e poeira retida",
      afterNotes: "Fibras claras revitalizadas, toque macio e aroma fresco sem resíduos químicos",
      stains: [
        {
          id: "sofa-s1",
          x: 42,
          y: 63,
          rx: 11,
          ry: 5.5,
          rotation: -8,
          color: "#5c4028",
          opacity: 0.55,
          label: "Mancha de Café e Uso",
          detail: "Extração profunda sem danificar a trama do linho"
        },
        {
          id: "sofa-s2",
          x: 59,
          y: 59,
          rx: 13,
          ry: 6,
          rotation: 6,
          color: "#4a3b2c",
          opacity: 0.48,
          label: "Escurecimento por Poeira",
          detail: "Remoção de sujidade acumulada nas almofadas"
        },
        {
          id: "sofa-s3",
          x: 33,
          y: 62,
          rx: 6,
          ry: 8,
          rotation: 12,
          color: "#523a24",
          opacity: 0.5,
          label: "Desgaste no Apoio de Braço",
          detail: "Dissolução enzimática de oleosidade corporal"
        }
      ]
    },
    {
      id: "carpet",
      title: "Tapete de Sala",
      subtitle: "Lavagem e realce de fibras",
      description: "Eliminação de sujidade de calçado, manchas de alimentos e recuperação do volume original das fibras.",
      serviceId: "carpet",
      image: "/src/assets/images/carpet_clean_after_1791476598146.jpg",
      metrics: {
        stainRemoval: "Brilho original restaurado",
        odorElimination: "100% livre de ácaros",
        dryingTime: "Secagem: 5h"
      },
      beforeNotes: "Fibras baixas, manchas escuras de passagem e acumulação de pó de rua",
      afterNotes: "Trama geométrica nítida, pelo macio e higienização profunda desde a base",
      stains: [
        {
          id: "carpet-s1",
          x: 46,
          y: 52,
          rx: 16,
          ry: 10,
          rotation: -18,
          color: "#4d3822",
          opacity: 0.56,
          label: "Zona de Tráfego Escurecida",
          detail: "Escovagem rotativa suave que solta a terra retida"
        },
        {
          id: "carpet-s2",
          x: 56,
          y: 67,
          rx: 11,
          ry: 7,
          rotation: 15,
          color: "#613d1f",
          opacity: 0.52,
          label: "Mancha Orgânica Antiga",
          detail: "Remoção completa de auréolas sem desbotar"
        }
      ]
    },
    {
      id: "car",
      title: "Interior de Carro",
      subtitle: "Detalhe e higienização de estofos",
      description: "Limpeza detalhada dos bancos em tecido e pele, removendo manchas de suor, bebidas e odores de fechado.",
      serviceId: "car",
      image: "/src/assets/images/car_interior_after_1791476608784.jpg",
      metrics: {
        stainRemoval: "Estofos como novos",
        odorElimination: "Ar interior renovado",
        dryingTime: "Secagem: 4h"
      },
      beforeNotes: "Auréolas nos assentos, marcas de suor no encosto e pó nas costuras",
      afterNotes: "Tecido uniforme, costuras limpas e acabamento mate original de fábrica",
      stains: [
        {
          id: "car-s1",
          x: 31,
          y: 52,
          rx: 11,
          ry: 14,
          rotation: -10,
          color: "#3d3126",
          opacity: 0.55,
          label: "Sujidade no Encosto Principal",
          detail: "Higienização por sucção controlada de baixa humidade"
        },
        {
          id: "car-s2",
          x: 46,
          y: 83,
          rx: 14,
          ry: 8,
          rotation: 8,
          color: "#4f3822",
          opacity: 0.58,
          label: "Auréola de Líquido no Assento",
          detail: "Extração total da mancha até à espuma interna"
        }
      ]
    },
    {
      id: "mattress",
      title: "Colchão de Casal",
      subtitle: "Sanitização profunda anti-ácaros",
      description: "Clareamento de manchas amareladas, remoção de suor acumulado e eliminação de ácaros e alergénios.",
      serviceId: "mattress",
      image: "/src/assets/images/mattress_clean_service_1791476621244.jpg",
      metrics: {
        stainRemoval: "Clareamento visível",
        odorElimination: "Anti-alérgico seguro",
        dryingTime: "Secagem: 4–5h"
      },
      beforeNotes: "Manchas amareladas de transpiração e acumulação invisível de ácaros",
      afterNotes: "Superfície branca, higienizada e segura para um sono tranquilo e saudável",
      stains: [
        {
          id: "mat-s1",
          x: 48,
          y: 49,
          rx: 18,
          ry: 9,
          rotation: -6,
          color: "#7c5e2a",
          opacity: 0.46,
          label: "Auréola de Transpiração",
          detail: "Tratamento oxigenado ativo para recuperar a brancura"
        },
        {
          id: "mat-s2",
          x: 62,
          y: 56,
          rx: 12,
          ry: 7,
          rotation: 12,
          color: "#6e5023",
          opacity: 0.44,
          label: "Mancha Orgânica Profunda",
          detail: "Eliminação de odores e bactérias na camada acolchoada"
        }
      ]
    }
  ] as ComparisonItem[],

  testimonials: [
    {
      name: "Maria S.",
      zone: "Talatona, Luanda",
      service: "Sofá 3 Lugares",
      text: "O sofá estava com manchas antigas dos miúdos e ficou com outra aparência. Atendimento rápido, super pontuais e muito cuidadosos com o chão da sala.",
      rating: 5
    },
    {
      name: "Carlos M.",
      zone: "Alvalade, Luanda",
      service: "Interior Completo SUV",
      text: "Fizeram a limpeza do interior do meu carro em casa e o resultado surpreendeu-me. Saíram todas as manchas dos bancos e o cheiro ficou impecável.",
      rating: 5
    },
    {
      name: "Ana P.",
      zone: "Maianga, Luanda",
      service: "Colchão + Tapete",
      text: "Gostei principalmente da pontualidade e do cuidado durante o serviço. Em menos de 5 horas já estava tudo seco e com um cheiro super fresco.",
      rating: 5
    }
  ],

  faq: [
    {
      q: "Quanto tempo demora a secar?",
      a: "Em condições normais em Luanda, a secagem demora aproximadamente 4 a 6 horas graças ao nosso sistema de extração de alta sucção. O tempo pode variar ligeiramente conforme o tecido e ventilação."
    },
    {
      q: "A limpeza tira completamente o mau cheiro?",
      a: "Sim! O nosso processo aplica bactericidas e neutralizadores que removem a origem biológica da sujidade e eliminam odores de mofo, suor, comida ou animais."
    },
    {
      q: "Limpam tecidos delicados como linho ou veludo?",
      a: "Sim. Antes de iniciar o serviço avaliamos a fibra do material e adaptamos a diluição dos produtos biodegradáveis e a pressão de extração ao tipo de tecido."
    },
    {
      q: "Quanto tempo demora o serviço na minha casa?",
      a: "Depende do tamanho e estado do item, mas em média leva entre 1h a 2h30. O tempo exato é confirmado consigo antes do atendimento."
    },
    {
      q: "Como posso pagar?",
      a: "Aceitamos pagamento por Multicaixa Express, transferência bancária imediata ou numerário após a conclusão e aprovação do serviço."
    }
  ],

  analytics: {
    googleAnalyticsId: "",
    plausibleDomain: ""
  },

  currency: "Kz",
  storageKey: "cleaning_angola_quote_v1",
  analyticsStorageKey: "cleaning_angola_analytics_v1"
};

export const SERVICES = [
  {
    id: "sofa" as const,
    name: "Sofás",
    description: "Higienização profunda por extração para remover sujidade, manchas e odores sem encharcar.",
    icon: "sofa",
    image: "/src/assets/images/sofa_clean_after_1791476578984.jpg",
    starting: () => CONFIG.prices.sofa["2"].min
  },
  {
    id: "carpet" as const,
    name: "Tapetes",
    description: "Limpeza cuidada ao domicílio ou com recolha para recuperar a frescura, cor e maciez.",
    icon: "carpet",
    image: "/src/assets/images/carpet_clean_after_1791476598146.jpg",
    starting: () => CONFIG.prices.carpet.m2.min
  },
  {
    id: "car" as const,
    name: "Interiores de carros",
    description: "Higienização detalhada de bancos, tetos, quartelas e alcatifas onde quer que esteja.",
    icon: "car",
    image: "/src/assets/images/car_interior_after_1791476608784.jpg",
    starting: () => CONFIG.prices.car.small.min
  },
  {
    id: "mattress" as const,
    name: "Colchões",
    description: "Desinfeção profunda anti-ácaros e remoção de manchas para um sono mais puro e saudável.",
    icon: "bed",
    image: "/src/assets/images/mattress_clean_service_1791476621244.jpg",
    starting: () => CONFIG.prices.mattress.single.min
  }
];
