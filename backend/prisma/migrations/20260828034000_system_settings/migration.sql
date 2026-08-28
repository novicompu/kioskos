-- Configuracion global del sistema (fila unica, id fijo "global")
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "allowManualLocation" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
