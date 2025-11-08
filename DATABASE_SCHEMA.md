-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.barang_bawaan_sampah (
  id_barang bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_reservasi bigint NOT NULL,
  nama_barang character varying NOT NULL,
  jenis_sampah USER-DEFINED NOT NULL,
  jumlah smallint,
  CONSTRAINT barang_bawaan_sampah_pkey PRIMARY KEY (id_barang),
  CONSTRAINT barang_bawaan_sampah_id_reservasi_fkey FOREIGN KEY (id_reservasi) REFERENCES public.reservasi(id_reservasi)
);
CREATE TABLE public.kategori_pengeluaran (
  id_kategori bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nama_kategori character varying NOT NULL UNIQUE,
  deskripsi text,
  CONSTRAINT kategori_pengeluaran_pkey PRIMARY KEY (id_kategori)
);
CREATE TABLE public.komentar (
  id_komentar bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_pengguna uuid NOT NULL,
  komentar text NOT NULL,
  dibuat_pada timestamp with time zone DEFAULT now(),
  rating smallint,
  CONSTRAINT komentar_pkey PRIMARY KEY (id_komentar),
  CONSTRAINT komentar_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.profiles(id)
);
CREATE TABLE public.kuota_harian (
  id_kuota bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  tanggal_kuota date NOT NULL UNIQUE,
  kuota_maksimal integer NOT NULL,
  kuota_terpesan integer NOT NULL DEFAULT 0,
  CONSTRAINT kuota_harian_pkey PRIMARY KEY (id_kuota)
);
CREATE TABLE public.pemasukan (
  id_pemasukan bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_reservasi bigint,
  id_admin uuid NOT NULL,
  jumlah integer NOT NULL,
  keterangan text NOT NULL,
  tanggal_pemasukan date NOT NULL,
  dibuat_pada timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pemasukan_pkey PRIMARY KEY (id_pemasukan),
  CONSTRAINT pemasukan_id_reservasi_fkey FOREIGN KEY (id_reservasi) REFERENCES public.reservasi(id_reservasi),
  CONSTRAINT pemasukan_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES public.profiles(id)
);
CREATE TABLE public.pendaki_rombongan (
  id_pendaki bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_reservasi bigint NOT NULL,
  nama_lengkap character varying NOT NULL,
  nik character varying NOT NULL,
  alamat text NOT NULL,
  nomor_telepon character varying NOT NULL,
  kontak_darurat character varying NOT NULL,
  url_surat_sehat character varying,
  CONSTRAINT pendaki_rombongan_pkey PRIMARY KEY (id_pendaki),
  CONSTRAINT pendaki_rombongan_id_reservasi_fkey FOREIGN KEY (id_reservasi) REFERENCES public.reservasi(id_reservasi)
);
CREATE TABLE public.pengaturan_biaya (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nama_item character varying NOT NULL UNIQUE,
  harga integer NOT NULL,
  deskripsi text,
  diperbarui_pada timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pengaturan_biaya_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pengeluaran (
  id_pengeluaran bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_admin uuid NOT NULL,
  id_kategori bigint,
  jumlah integer NOT NULL,
  keterangan text NOT NULL,
  tanggal_pengeluaran date NOT NULL,
  dibuat_pada timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pengeluaran_pkey PRIMARY KEY (id_pengeluaran),
  CONSTRAINT pengeluaran_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES public.profiles(id),
  CONSTRAINT pengeluaran_id_kategori_fkey FOREIGN KEY (id_kategori) REFERENCES public.kategori_pengeluaran(id_kategori)
);
CREATE TABLE public.pengumuman (
  id_pengumuman bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_admin uuid NOT NULL,
  judul character varying NOT NULL,
  konten text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  telah_terbit boolean NOT NULL DEFAULT false,
  dibuat_pada timestamp with time zone NOT NULL DEFAULT now(),
  diperbarui_pada timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pengumuman_pkey PRIMARY KEY (id_pengumuman),
  CONSTRAINT pengumuman_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_lengkap character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  nomor_telepon character varying,
  alamat text,
  peran USER-DEFINED NOT NULL DEFAULT 'pendaki'::peran_pengguna,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.promosi (
  id_promosi bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nama_promosi character varying NOT NULL,
  deskripsi_promosi text,
  tipe_promosi character varying NOT NULL CHECK (tipe_promosi::text = ANY (ARRAY['PERSENTASE'::character varying, 'POTONGAN_TETAP'::character varying, 'HARGA_KHUSUS'::character varying]::text[])),
  nilai_promosi numeric NOT NULL,
  kondisi_min_pendaki integer DEFAULT 1,
  kondisi_max_pendaki integer,
  tanggal_mulai timestamp with time zone NOT NULL,
  tanggal_akhir timestamp with time zone NOT NULL,
  is_aktif boolean NOT NULL DEFAULT true,
  dibuat_pada timestamp with time zone NOT NULL DEFAULT now(),
  kode_promo character varying DEFAULT 'NULL'::character varying UNIQUE,
  CONSTRAINT promosi_pkey PRIMARY KEY (id_promosi)
);
CREATE TABLE public.promosi_poster (
  id_poster bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  judul_poster character varying NOT NULL,
  deskripsi_poster text,
  url_gambar character varying NOT NULL,
  url_tautan character varying,
  is_aktif boolean NOT NULL DEFAULT true,
  urutan integer NOT NULL DEFAULT 0,
  dibuat_pada timestamp with time zone NOT NULL DEFAULT now(),
  id_promosi_terkait bigint,
  CONSTRAINT promosi_poster_pkey PRIMARY KEY (id_poster),
  CONSTRAINT fk_promosi_poster_ke_promosi FOREIGN KEY (id_promosi_terkait) REFERENCES public.promosi(id_promosi)
);
CREATE TABLE public.reservasi (
  id_reservasi bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_pengguna uuid NOT NULL,
  kode_reservasi character varying NOT NULL UNIQUE,
  tanggal_pendakian date NOT NULL,
  jumlah_pendaki smallint NOT NULL,
  jumlah_tiket_parkir smallint NOT NULL DEFAULT 0,
  total_harga integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'menunggu_pembayaran'::status_reservasi,
  jumlah_potensi_sampah smallint,
  status_sampah USER-DEFINED NOT NULL DEFAULT 'belum_dicek'::status_sampah_enum,
  dipesan_pada timestamp with time zone NOT NULL DEFAULT now(),
  tanggal_keluar date,
  id_kuota bigint,
  CONSTRAINT reservasi_pkey PRIMARY KEY (id_reservasi),
  CONSTRAINT reservasi_id_pengguna_fkey FOREIGN KEY (id_pengguna) REFERENCES public.profiles(id),
  CONSTRAINT fk_reservasi_ke_kuota FOREIGN KEY (id_kuota) REFERENCES public.kuota_harian(id_kuota)
);

//function


DECLARE
    v_id_kuota bigint;
BEGIN
    -- Ini adalah kunci anti-jebol:
    -- Coba UPDATE kuota HANYA JIKA sisa kuota >= jumlah yang diminta.
    UPDATE public.kuota_harian
    SET kuota_terpesan = kuota_terpesan + p_jumlah
    WHERE tanggal_kuota = p_tanggal
    AND (kuota_maksimal - kuota_terpesan) >= p_jumlah
    RETURNING id_kuota INTO v_id_kuota; -- Ambil id_kuota JIKA update berhasil

    -- Jika v_id_kuota null, berarti update gagal (kuota tidak cukup)
    IF v_id_kuota IS NULL THEN
        RAISE EXCEPTION 'Kuota tidak mencukupi atau tanggal tidak ditemukan.';
    END IF;
    
    RETURN v_id_kuota;
END;


DECLARE
    v_kuota_tersisa INT;
BEGIN
    SELECT (kuota_maksimal - kuota_terpesan) INTO v_kuota_tersisa
    FROM public.kuota_harian
    WHERE tanggal_kuota = p_tanggal_pendakian;

    IF v_kuota_tersisa IS NOT NULL AND v_kuota_tersisa >= p_jumlah_diminta THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;


DECLARE
    v_harga_tiket integer;
    v_harga_parkir integer;
BEGIN
    SELECT harga INTO v_harga_tiket FROM public.pengaturan_biaya WHERE nama_item = 'tiket_masuk';
    SELECT harga INTO v_harga_parkir FROM public.pengaturan_biaya WHERE nama_item = 'tiket_parkir';
    
    RETURN (v_harga_tiket * p_jumlah_pendaki) + (v_harga_parkir * p_jumlah_parkir);
END;


DECLARE
    v_reservasi RECORD;
BEGIN
    -- Ambil data reservasi dan pastikan statusnya 'menunggu_pembayaran'
    SELECT * INTO v_reservasi
    FROM public.reservasi
    WHERE id_reservasi = input_id_reservasi AND status = 'menunggu_pembayaran';

    -- Jika reservasi tidak ditemukan atau statusnya salah, kirim pesan error
    IF NOT FOUND THEN
        RETURN 'Error: Reservasi tidak ditemukan atau sudah dikonfirmasi/dibatalkan.';
    END IF;

    -- Langkah 1: Ubah status reservasi menjadi 'terkonfirmasi'
    UPDATE public.reservasi
    SET status = 'terkonfirmasi'
    WHERE id_reservasi = input_id_reservasi;

    -- Langkah 2: Tambahkan data baru ke tabel pemasukan
    INSERT INTO public.pemasukan (id_reservasi, id_admin, jumlah, keterangan, tanggal_pemasukan)
    VALUES (
        input_id_reservasi,
        input_id_admin,
        v_reservasi.total_harga,
        CONCAT('Pemasukan dari tiket reservasi kode: ', v_reservasi.kode_reservasi),
        CURRENT_DATE
    );

    RETURN 'Success: Reservasi berhasil dikonfirmasi dan pemasukan dicatat.';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: Terjadi kesalahan pada database.';
END;


BEGIN
  -- KASUS 1: Reservasi BARU DIBUAT (INSERT)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status != 'dibatalkan' THEN
      UPDATE public.kuota_harian
      SET kuota_terpesan = kuota_terpesan + NEW.jumlah_pendaki
      WHERE tanggal_kuota = NEW.tanggal_pendakian;
    END IF;
  
  -- KASUS 2: Reservasi DIPERBARUI (UPDATE)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Status berubah dari aktif MENJADI 'dibatalkan' -> Kurangi kuota
    IF OLD.status != 'dibatalkan' AND NEW.status = 'dibatalkan' THEN
      UPDATE public.kuota_harian
      SET kuota_terpesan = kuota_terpesan - OLD.jumlah_pendaki
      WHERE tanggal_kuota = OLD.tanggal_pendakian;
    
    -- Status berubah DARI 'dibatalkan' menjadi aktif -> Tambah kuota
    ELSIF OLD.status = 'dibatalkan' AND NEW.status != 'dibatalkan' THEN
      UPDATE public.kuota_harian
      SET kuota_terpesan = kuota_terpesan + NEW.jumlah_pendaki
      WHERE tanggal_kuota = NEW.tanggal_pendakian;
    END IF;
    
  -- KASUS 3: Reservasi DIHAPUS (DELETE) - BARU!
  ELSIF (TG_OP = 'DELETE') THEN
    -- Jika reservasi yang dihapus tidak dalam status 'dibatalkan' -> Kurangi kuota
    IF OLD.status != 'dibatalkan' THEN
        UPDATE public.kuota_harian
        SET kuota_terpesan = kuota_terpesan - OLD.jumlah_pendaki
        WHERE tanggal_kuota = OLD.tanggal_pendakian;
    END IF;
  END IF;
  
  -- Untuk operasi INSERT/UPDATE, kembalikan NEW. Untuk DELETE, kembalikan OLD.
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
