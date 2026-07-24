import { Bell, ChevronDown, QrCode, UserSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../../shared/components/avatar";
import { Card } from "../../shared/components/ui/card";
import { MOCK_RECENT_DELIVERIES } from "../delivery/mock-data";

const SUMMARY = [
  { label: "Entregas", value: 35 },
  { label: "Funcionarios", value: 28 },
  { label: "Tipos de EPI", value: 12 },
];

export function DashboardPage() {
  return (
    <div>
      <header className="bg-gradient-to-br from-primary-600 to-primary-700 px-4 pb-16 pt-6 text-white sm:px-6 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Ola, Marcio! 👋</p>
            <button type="button" className="mt-1 flex items-center gap-1 text-sm text-primary-100">
              Almoxarifado Central
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            aria-label="Notificacoes"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="hidden items-center justify-between border-b border-neutral-200 bg-white px-8 py-5 lg:flex dark:border-neutral-700 dark:bg-neutral-800">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Ola, Marcio 👋</h1>
          <button type="button" className="mt-1 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
            Almoxarifado Central
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Notificacoes"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto -mt-10 max-w-6xl px-4 pb-8 sm:px-6 lg:mt-0 lg:px-8 lg:pt-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Link to="/entregas/nova">
            <Card className="flex h-full flex-col items-center justify-center gap-2 p-5 text-center transition-shadow hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <QrCode className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Escanear QR Code
              </span>
            </Card>
          </Link>
          <Link to="/entregas/nova">
            <Card className="flex h-full flex-col items-center justify-center gap-2 p-5 text-center transition-shadow hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <UserSearch className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Buscar Funcionario
              </span>
            </Card>
          </Link>

          {SUMMARY.map((item) => (
            <Card key={item.label} className="hidden flex-col justify-center p-5 lg:flex">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.label}</p>
              <p className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        <Card className="mt-4 p-5 lg:hidden">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Resumo de hoje</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {SUMMARY.map((item) => (
              <div key={item.label}>
                <p className="text-2xl font-semibold text-primary-600">{item.value}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Ultimas entregas</h2>
            <Link to="/entregas/historico" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Ver todas
            </Link>
          </div>

          <Card className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {MOCK_RECENT_DELIVERIES.map((delivery) => (
              <div key={delivery.id} className="flex items-center gap-3 p-4">
                <Avatar name={delivery.name} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {delivery.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Matricula: {delivery.registration}
                  </p>
                </div>
                <span className="text-xs text-neutral-400">{delivery.time}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
