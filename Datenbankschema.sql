-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  perfume_id uuid NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT list_items_pkey PRIMARY KEY (id),
  CONSTRAINT list_items_perfume_id_fkey FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id),
  CONSTRAINT list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id)
);
CREATE TABLE public.lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (char_length(TRIM(BOTH FROM name)) > 0 AND char_length(name) <= 100),
  description text CHECK (description IS NULL OR char_length(description) <= 500),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lists_pkey PRIMARY KEY (id),
  CONSTRAINT lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  family text,
  CONSTRAINT notes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.perfume_notes (
  perfume_id uuid NOT NULL,
  note_id uuid NOT NULL,
  note_type text NOT NULL,
  CONSTRAINT perfume_notes_pkey PRIMARY KEY (perfume_id, note_id, note_type),
  CONSTRAINT perfume_notes_perfume_id_fkey FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id),
  CONSTRAINT perfume_notes_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.perfumes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  longevity text,
  sillage text,
  performance double precision,
  desc text,
  brand_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  image_url text CHECK (image_url IS NULL OR image_url ~~ 'https://%'::text),
  concentration text,
  ean text,
  CONSTRAINT perfumes_pkey PRIMARY KEY (id),
  CONSTRAINT perfumes_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$'::text),
  updated_at timestamp with time zone DEFAULT now(),
  is_public boolean NOT NULL DEFAULT true,
  bio text CHECK (bio IS NULL OR char_length(bio) <= 200),
  avatar_url text CHECK (avatar_url IS NULL OR avatar_url ~~ 'https://%'::text),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.review_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_likes_pkey PRIMARY KEY (id),
  CONSTRAINT review_likes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT review_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  perfume_id uuid,
  title text NOT NULL CHECK (char_length(TRIM(BOTH FROM title)) <= 100),
  text text NOT NULL CHECK (char_length(TRIM(BOTH FROM text)) >= 10 AND char_length(text) <= 500),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  author_name text CHECK (author_name IS NULL OR char_length(TRIM(BOTH FROM author_name)) >= 1 AND char_length(author_name) <= 50 AND author_name ~ '^[\w\s.\-äöüÄÖÜß]+$'::text),
  longevity integer CHECK (longevity IS NULL OR longevity >= 0 AND longevity <= 100),
  sillage integer CHECK (sillage IS NULL OR sillage >= 0 AND sillage <= 100),
  occasions ARRAY DEFAULT '{}'::text[],
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_perfume_id_fkey FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_perfumes (
  user_id uuid NOT NULL,
  perfume_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_favorite boolean NOT NULL DEFAULT false,
  is_owned boolean NOT NULL DEFAULT false,
  is_want_to_try boolean NOT NULL DEFAULT false,
  CONSTRAINT user_perfumes_pkey PRIMARY KEY (user_id, perfume_id),
  CONSTRAINT user_perfumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_perfumes_perfume_id_fkey FOREIGN KEY (perfume_id) REFERENCES public.perfumes(id)
);