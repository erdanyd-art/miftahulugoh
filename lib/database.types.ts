
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "absensi_murid": {
                  Row: {
                    "hadir": boolean,"peserta_id": string,"sesi_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hadir": boolean,"peserta_id": string,"sesi_id": string
                  }
                  Update: {
                    "hadir"?: boolean,"peserta_id"?: string,"sesi_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "absensi_murid_peserta_id_fkey"
      columns: ["peserta_id"]
isOneToOne: false
      referencedRelation: "peserta"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "absensi_murid_sesi_id_fkey"
      columns: ["sesi_id"]
isOneToOne: false
      referencedRelation: "sesi"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "aksi": string,"baris_id": string | null,"id": number,"pengguna_id": string | null,"sebelum": Json | null,"sesudah": Json | null,"tabel": string,"waktu": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aksi": string,"baris_id"?: string | null,"id"?: never,"pengguna_id"?: string | null,"sebelum"?: Json | null,"sesudah"?: Json | null,"tabel": string,"waktu"?: string
                  }
                  Update: {
                    "aksi"?: string,"baris_id"?: string | null,"id"?: never,"pengguna_id"?: string | null,"sebelum"?: Json | null,"sesudah"?: Json | null,"tabel"?: string,"waktu"?: string
                  }
                  Relationships: [
                    
                  ]
                },"jadwal": {
                  Row: {
                    "aktif": boolean,"dibuat_pada": string,"diubah_pada": string,"hari": number,"honor": number,"id": string,"jam_mulai": string,"jam_selesai": string,"kelas_id": string,"meet_url": string | null,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"hari": number,"honor": number,"id"?: string,"jam_mulai": string,"jam_selesai": string,"kelas_id": string,"meet_url"?: string | null,"tutor_id": string
                  }
                  Update: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"hari"?: number,"honor"?: number,"id"?: string,"jam_mulai"?: string,"jam_selesai"?: string,"kelas_id"?: string,"meet_url"?: string | null,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "jadwal_kelas_id_fkey"
      columns: ["kelas_id"]
isOneToOne: false
      referencedRelation: "kelas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jadwal_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"kas": {
                  Row: {
                    "dibuat_oleh": string | null,"dibuat_pada": string,"dihapus_pada": string | null,"diubah_pada": string,"id": string,"jenis": Database["public"]['Enums']["jenis_kas"],"jumlah": number,"kategori_id": string,"keterangan": string | null,"tanggal": string,"tutor_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jenis": Database["public"]['Enums']["jenis_kas"],"jumlah": number,"kategori_id": string,"keterangan"?: string | null,"tanggal": string,"tutor_id"?: string | null
                  }
                  Update: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jenis"?: Database["public"]['Enums']["jenis_kas"],"jumlah"?: number,"kategori_id"?: string,"keterangan"?: string | null,"tanggal"?: string,"tutor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "kas_dibuat_oleh_fkey"
      columns: ["dibuat_oleh"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kas_kategori_id_fkey"
      columns: ["kategori_id"]
isOneToOne: false
      referencedRelation: "kategori_kas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kas_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"kategori_kas": {
                  Row: {
                    "aktif": boolean,"butuh_tutor": boolean,"id": string,"jenis": Database["public"]['Enums']["jenis_kas"],"nama": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"butuh_tutor"?: boolean,"id"?: string,"jenis": Database["public"]['Enums']["jenis_kas"],"nama": string
                  }
                  Update: {
                    "aktif"?: boolean,"butuh_tutor"?: boolean,"id"?: string,"jenis"?: Database["public"]['Enums']["jenis_kas"],"nama"?: string
                  }
                  Relationships: [
                    
                  ]
                },"kelas": {
                  Row: {
                    "aktif": boolean,"dibuat_pada": string,"diubah_pada": string,"id": string,"keterangan": string | null,"nama": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"keterangan"?: string | null,"nama": string
                  }
                  Update: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"keterangan"?: string | null,"nama"?: string
                  }
                  Relationships: [
                    
                  ]
                },"kelas_peserta": {
                  Row: {
                    "dibuat_pada": string,"kelas_id": string,"peserta_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_pada"?: string,"kelas_id": string,"peserta_id": string
                  }
                  Update: {
                    "dibuat_pada"?: string,"kelas_id"?: string,"peserta_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "kelas_peserta_kelas_id_fkey"
      columns: ["kelas_id"]
isOneToOne: false
      referencedRelation: "kelas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kelas_peserta_peserta_id_fkey"
      columns: ["peserta_id"]
isOneToOne: false
      referencedRelation: "peserta"
      referencedColumns: ["id"]
    }
                  ]
                },"pembayaran": {
                  Row: {
                    "dibuat_oleh": string | null,"dibuat_pada": string,"dihapus_pada": string | null,"diubah_pada": string,"id": string,"jumlah": number,"keterangan": string,"peserta_id": string,"status": Database["public"]['Enums']["status_pembayaran"],"tanggal": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jumlah": number,"keterangan": string,"peserta_id": string,"status"?: Database["public"]['Enums']["status_pembayaran"],"tanggal": string
                  }
                  Update: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jumlah"?: number,"keterangan"?: string,"peserta_id"?: string,"status"?: Database["public"]['Enums']["status_pembayaran"],"tanggal"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pembayaran_dibuat_oleh_fkey"
      columns: ["dibuat_oleh"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pembayaran_peserta_id_fkey"
      columns: ["peserta_id"]
isOneToOne: false
      referencedRelation: "peserta"
      referencedColumns: ["id"]
    }
                  ]
                },"pengaturan": {
                  Row: {
                    "id": boolean,"nama_lembaga": string,"zona_waktu": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"nama_lembaga"?: string,"zona_waktu"?: string
                  }
                  Update: {
                    "id"?: boolean,"nama_lembaga"?: string,"zona_waktu"?: string
                  }
                  Relationships: [
                    
                  ]
                },"peserta": {
                  Row: {
                    "aktif": boolean,"catatan": string | null,"dibuat_pada": string,"diubah_pada": string,"id": string,"nama": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"catatan"?: string | null,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"nama": string,"user_id"?: string | null
                  }
                  Update: {
                    "aktif"?: boolean,"catatan"?: string | null,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"nama"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "aktif": boolean,"dibuat_pada": string,"id": string,"nama": string,"peran": Database["public"]['Enums']["peran_pengguna"]
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"id": string,"nama": string,"peran": Database["public"]['Enums']["peran_pengguna"]
                  }
                  Update: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"id"?: string,"nama"?: string,"peran"?: Database["public"]['Enums']["peran_pengguna"]
                  }
                  Relationships: [
                    
                  ]
                },"sesi": {
                  Row: {
                    "dibuat_pada": string,"dikunci": boolean,"diubah_pada": string,"hadir": number,"honor": number,"honor_dikoreksi": boolean,"honor_standar": number,"id": string,"jadwal_id": string,"kelas_id": string,"tanggal": string,"total": number,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_pada"?: string,"dikunci"?: boolean,"diubah_pada"?: string,"hadir"?: number,"honor": number,"honor_dikoreksi"?: boolean,"honor_standar": number,"id"?: string,"jadwal_id": string,"kelas_id": string,"tanggal": string,"total"?: number,"tutor_id": string
                  }
                  Update: {
                    "dibuat_pada"?: string,"dikunci"?: boolean,"diubah_pada"?: string,"hadir"?: number,"honor"?: number,"honor_dikoreksi"?: boolean,"honor_standar"?: number,"id"?: string,"jadwal_id"?: string,"kelas_id"?: string,"tanggal"?: string,"total"?: number,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sesi_jadwal_id_fkey"
      columns: ["jadwal_id"]
isOneToOne: false
      referencedRelation: "jadwal"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sesi_kelas_id_fkey"
      columns: ["kelas_id"]
isOneToOne: false
      referencedRelation: "kelas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sesi_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "impor_peserta":
{ Args: { "p_baris": Json }; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"koreksi_honor":
{ Args: { "p_honor": number,"p_sesi_id": string }; Returns: undefined
                           },
"kunci_sesi":
{ Args: { "p_kunci": boolean,"p_sesi_id": string }; Returns: undefined
                           },
"peran_saya":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["peran_pengguna"]
                           },
"saldo_honor":
{ Args: Record<PropertyKey, never>; Returns: {
              "honor_dibayar": number,"honor_terkumpul": number,"nama": string,"saldo": number,"tutor_id": string
            }[]
                           },
"simpan_absensi":
{ Args: { "p_hadir_ids": (string)[],"p_jadwal_id": string,"p_tanggal": string }; Returns: string
                           },
"ubah_meet":
{ Args: { "p_jadwal_id": string,"p_url": string }; Returns: undefined
                           }
          }
          Enums: {
            "jenis_kas": "pemasukan"|"pengeluaran","peran_pengguna": "admin"|"tutor","status_pembayaran": "lunas"|"belum_lunas"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "jenis_kas": ["pemasukan", "pengeluaran"],"peran_pengguna": ["admin", "tutor"],"status_pembayaran": ["lunas", "belum_lunas"]
          }
        }
} as const
