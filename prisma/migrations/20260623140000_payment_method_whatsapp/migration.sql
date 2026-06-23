-- Ajoute WHATSAPP comme méthode de paiement (commandes prises via WhatsApp).
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'WHATSAPP';
