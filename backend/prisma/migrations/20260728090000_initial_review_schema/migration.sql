-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "ScraperRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "booking_url" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "external_review_id" VARCHAR(160),
    "fingerprint" CHAR(64) NOT NULL,
    "reviewer_name" VARCHAR(160),
    "reviewer_country" VARCHAR(100),
    "rating" DECIMAL(3,1) NOT NULL,
    "title" VARCHAR(500),
    "review_text" TEXT,
    "positive_comment" TEXT,
    "negative_comment" TEXT,
    "review_date" DATE NOT NULL,
    "stay_date" DATE,
    "room_type" VARCHAR(200),
    "traveller_type" VARCHAR(100),
    "nights_stayed" SMALLINT,
    "source_url" VARCHAR(500) NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "is_synthetic" BOOLEAN NOT NULL DEFAULT false,
    "scraped_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 0 AND "rating" <= 10),
    CONSTRAINT "reviews_nights_stayed_check" CHECK ("nights_stayed" IS NULL OR "nights_stayed" > 0)
);

CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_topics" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "confidence" DECIMAL(4,3),
    "matched_text" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_topics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_topics_confidence_check"
        CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1))
);

CREATE TABLE "scraper_runs" (
    "id" UUID NOT NULL,
    "property_id" UUID,
    "status" "ScraperRunStatus" NOT NULL DEFAULT 'RUNNING',
    "reviews_found" INTEGER NOT NULL DEFAULT 0,
    "reviews_inserted" INTEGER NOT NULL DEFAULT 0,
    "reviews_updated" INTEGER NOT NULL DEFAULT 0,
    "duplicates_skipped" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "scraper_runs_counts_check" CHECK (
        "reviews_found" >= 0
        AND "reviews_inserted" >= 0
        AND "reviews_updated" >= 0
        AND "duplicates_skipped" >= 0
    )
);

-- Uniqueness and read-path indexes.
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");
CREATE UNIQUE INDEX "properties_booking_url_key" ON "properties"("booking_url");
CREATE INDEX "properties_active_name_idx" ON "properties"("active", "name");
CREATE UNIQUE INDEX "reviews_property_id_external_review_id_key"
    ON "reviews"("property_id", "external_review_id");
CREATE UNIQUE INDEX "reviews_property_id_fingerprint_key"
    ON "reviews"("property_id", "fingerprint");
CREATE INDEX "reviews_property_id_review_date_idx"
    ON "reviews"("property_id", "review_date" DESC);
CREATE INDEX "reviews_review_date_idx" ON "reviews"("review_date" DESC);
CREATE INDEX "reviews_sentiment_review_date_idx"
    ON "reviews"("sentiment", "review_date" DESC);
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");
CREATE UNIQUE INDEX "topics_key_key" ON "topics"("key");
CREATE INDEX "topics_active_display_name_idx" ON "topics"("active", "display_name");
CREATE UNIQUE INDEX "review_topics_review_id_topic_id_key"
    ON "review_topics"("review_id", "topic_id");
CREATE INDEX "review_topics_topic_id_sentiment_idx"
    ON "review_topics"("topic_id", "sentiment");
CREATE INDEX "review_topics_review_id_idx" ON "review_topics"("review_id");
CREATE INDEX "scraper_runs_started_at_idx" ON "scraper_runs"("started_at" DESC);
CREATE INDEX "scraper_runs_status_started_at_idx"
    ON "scraper_runs"("status", "started_at" DESC);
CREATE INDEX "scraper_runs_property_id_started_at_idx"
    ON "scraper_runs"("property_id", "started_at" DESC);

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "properties"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "review_topics"
    ADD CONSTRAINT "review_topics_review_id_fkey"
    FOREIGN KEY ("review_id") REFERENCES "reviews"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_topics"
    ADD CONSTRAINT "review_topics_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scraper_runs"
    ADD CONSTRAINT "scraper_runs_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "properties"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
