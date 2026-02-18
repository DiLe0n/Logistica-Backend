-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "numero_celular" VARCHAR(15),
    "numero_trabajador" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" SERIAL NOT NULL,
    "eco" VARCHAR(20) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "placas" VARCHAR(20),
    "marca" VARCHAR(50),
    "modelo" VARCHAR(50),
    "tipo_detalle" VARCHAR(50),
    "google_sheets_sync" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "contenedor" VARCHAR(50) NOT NULL,
    "chasis_id" INTEGER,
    "tipo" VARCHAR(10),
    "placa" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "tracto_id" INTEGER,
    "eco_tracto" VARCHAR(20),
    "placa_tracto" VARCHAR(20),
    "operacion" VARCHAR(100) NOT NULL,
    "operador" VARCHAR(150) NOT NULL,
    "destino" VARCHAR(200),
    "cartas_porte" TEXT,
    "estatus" VARCHAR(50),
    "dolly_sistema" VARCHAR(50),
    "generador" VARCHAR(50),
    "observaciones" TEXT,
    "json_completo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_equipos" (
    "id" SERIAL NOT NULL,
    "registro_id" INTEGER NOT NULL,
    "equipo_id" INTEGER NOT NULL,

    CONSTRAINT "registros_equipos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_eco_key" ON "inventario"("eco");

-- CreateIndex
CREATE INDEX "registros_fecha_hora_idx" ON "registros"("fecha_hora" DESC);

-- CreateIndex
CREATE INDEX "registros_operador_idx" ON "registros"("operador");

-- CreateIndex
CREATE INDEX "registros_operacion_idx" ON "registros"("operacion");

-- CreateIndex
CREATE UNIQUE INDEX "registros_equipos_registro_id_equipo_id_key" ON "registros_equipos"("registro_id", "equipo_id");

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_chasis_id_fkey" FOREIGN KEY ("chasis_id") REFERENCES "inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_tracto_id_fkey" FOREIGN KEY ("tracto_id") REFERENCES "inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_equipos" ADD CONSTRAINT "registros_equipos_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "registros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_equipos" ADD CONSTRAINT "registros_equipos_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
