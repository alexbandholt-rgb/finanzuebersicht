-- Tägliche Krypto-Preise (global, nicht pro User)
CREATE TABLE IF NOT EXISTS crypto_daily_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coin_id text NOT NULL,
  price_eur numeric(18, 8) NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (coin_id, date)
);

-- Öffentlich lesbar (Preise sind keine persönlichen Daten)
ALTER TABLE crypto_daily_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preise sind öffentlich lesbar"
  ON crypto_daily_prices FOR SELECT
  USING (true);

-- Nur Service Role darf schreiben (Edge Function)
CREATE POLICY "Nur Service Role darf schreiben"
  ON crypto_daily_prices FOR INSERT
  WITH CHECK (true);
