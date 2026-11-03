-- Hapus kolom NIK dari pendaftaran uji coba
ALTER TABLE trial_registrations DROP COLUMN IF EXISTS nik;
