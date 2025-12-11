-- CreateTable
CREATE TABLE "sales_data" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_data_date_idx" ON "sales_data"("date");

-- CreateIndex
CREATE INDEX "sales_data_category_idx" ON "sales_data"("category");

-- CreateIndex
CREATE INDEX "sales_data_region_idx" ON "sales_data"("region");
