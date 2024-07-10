export interface ValueItem{
    id: number;
    name: string;
}

export interface SlugValueItem extends ValueItem{
    slug: string;
}


export interface PublicService extends SlugValueItem{
    icon: string;
    description: string;
    is_active: boolean;
    group: null | unknown;
}

export interface FastTrack{
    id: number;
    name: string;
    description: string,
    url: string,
    date: string,
    start_date: string,
    end_date: string,
    form_id: string,
    is_fast_track_expired: boolean
}

export interface Profession extends SlugValueItem{
    professional_sphere: SlugValueItem
}

export interface VacancyInfo{
    id: number;
    cities: Array<SlugValueItem>;
    employment_types: Array<string>;
    pro_level_min_display: string;
    pro_level_max_display: string;
    profession: Profession;
    public_professions: Array<Profession>;
    skills: Array<ValueItem>;
    work_modes: Array<SlugValueItem>;
}

export interface VacancyResult{
    id: number;
    status: string;
    vacancy: VacancyInfo;
    public_service: PublicService;
    is_chief: boolean;
    fast_track: FastTrack | null;
    redirect_url: null | string;
    version: number;
    lang: string;
    title: string;
    short_summary: string;
}

export interface VacanciesResponse{
    count: number;
    counters: Record<string, Record<string, number>>;
    next: null | string;
    previous: null | string;
    reqId: string;
    results: Array<VacancyResult>;
    spellcheck: Record<string, unknown>;
}