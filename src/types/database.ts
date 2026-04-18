export type UserType = 'teacher' | 'institution';
export type PositionType = '원감' | '담임교사' | '보조교사' | '방과후교사' | '특별활동강사';
export type AgeGroupType = '만3세' | '만4세' | '만5세' | '혼합연령' | '무관';
export type EmploymentType = '정규직' | '기간제' | '시간제';
export type KindergartenType = '국공립(단설)' | '국공립(병설)' | '사립(개인)' | '사립(법인)' | '사립(종교)';
export type EvalGrade = 'A' | 'B' | 'C' | 'D';
export type ApplicationStatus = '검토중' | '면접요청' | '합격' | '불합격';
export type NotificationType = 'application_received' | 'status_changed' | 'interview_request' | 'result_notification';
export type PurposeType = '교원모집' | '구인';

// Row types
export interface Profile {
  id: string;
  email: string;
  user_type: UserType;
  created_at: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  birth_date: string;
  address: string;
  phone: string;
  photo_url: string | null;
  affiliation: string | null;
  university: string | null;
  certificates: { name: string; issuer: string }[];
  created_at: string;
}

export interface InstitutionProfile {
  id: string;
  name: string;
  type: KindergartenType;
  address: string;
  address_short: string;
  phone: string;
  business_number: string;
  registration_number: string | null;
  email: string;
  director_name: string;
  purpose: PurposeType[];
  description: string | null;
  student_count: number | null;
  class_count: number | null;
  evaluation_grade: EvalGrade | null;
  photos: string[];
  nearby_stations: string[];
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface Posting {
  id: string;
  institution_id: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface PositionEntry {
  id: string;
  posting_id: string;
  position: PositionType;
  age_group: AgeGroupType;
  headcount: number;
  employment_type: EmploymentType;
  salary: string;
  salary_negotiable: boolean;
  work_hours: string;
  benefits: string[];
  requirements: string[];
  preferred: string[];
  has_vacation: boolean;
  vacation_info: string | null;
  insurance_provided: boolean;
  retirement_pay_provided: boolean;
  meal_provided: boolean;
  custom_questions: string[];
  created_at: string;
}

export interface Resume {
  id: string;
  teacher_id: string;
  photo_url: string | null;
  name: string;
  birth_date: string;
  phone: string;
  certificates: { name: string; issuer: string }[];
  affiliation: string | null;
  experiences: { institution: string; period: string; role: string; age_group: string }[];
  introduction: string;
  portfolio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  posting_id: string;
  position_entry_id: string;
  teacher_id: string;
  resume_id: string;
  message: string;
  answers: string[];
  status: ApplicationStatus;
  applied_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

// Supabase Database type — minimal for typed client
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string; user_type: UserType }; Update: Partial<Profile> };
      teacher_profiles: { Row: TeacherProfile; Insert: Partial<TeacherProfile> & { id: string; name: string; birth_date: string; address: string; phone: string }; Update: Partial<TeacherProfile> };
      institution_profiles: { Row: InstitutionProfile; Insert: Partial<InstitutionProfile> & { id: string; name: string; type: string; address: string; address_short: string; phone: string; business_number: string; email: string }; Update: Partial<InstitutionProfile> };
      postings: { Row: Posting; Insert: Partial<Posting> & { institution_id: string; title: string; deadline: string }; Update: Partial<Posting> };
      position_entries: { Row: PositionEntry; Insert: Partial<PositionEntry> & { posting_id: string; position: string }; Update: Partial<PositionEntry> };
      resumes: { Row: Resume; Insert: Partial<Resume> & { teacher_id: string; name: string; birth_date: string; phone: string }; Update: Partial<Resume> };
      applications: { Row: Application; Insert: Partial<Application> & { posting_id: string; position_entry_id: string; teacher_id: string; resume_id: string }; Update: Partial<Application> };
      notifications: { Row: Notification; Insert: Partial<Notification> & { user_id: string; type: string; title: string; message: string }; Update: Partial<Notification> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Join types
export type PostingWithPositions = Posting & {
  position_entries: PositionEntry[];
  institution_profiles: InstitutionProfile;
};

export type ApplicationWithDetails = Application & {
  resumes: Resume;
  teacher_profiles: TeacherProfile;
  position_entries: PositionEntry;
  postings: Posting & { institution_profiles: InstitutionProfile };
};
