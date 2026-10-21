export interface DeveloperProfile {
	name: string;
	role: string;
	institution: string;
	course: string;
	email: string;
	githubUrl: string;
	photoUrl: string | null;
	isCustomized: boolean;
}

const STORAGE_KEY = 'microfi_developer_profile';

export const DEFAULT_PROFILE: DeveloperProfile = {
	name: 'Leonardo huaman mezarina / Desarrollador ',
	role: 'Desarrollador de Software / Alumno',
	institution: 'Valle grande',
	course: 'Taller de Proyectos / Desarrollo Web3',
	email: 'leonardo@vallegrande.edu.pe',
	githubUrl: 'https://github.com/LeonardoHuamanMezarina',
	photoUrl: null,
	isCustomized: false
};

class DeveloperStore {
	profile = $state<DeveloperProfile>(this.loadInitial());

	private loadInitial(): DeveloperProfile {
		if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) return JSON.parse(saved);
		} catch (e) {
			console.warn('Error al cargar perfil guardado:', e);
		}
		return { ...DEFAULT_PROFILE };
	}

	save(updated: Partial<DeveloperProfile>) {
		this.profile = {
			...this.profile,
			...updated,
			isCustomized: true
		};
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
			} catch (e) {
				console.warn('Error al persistir perfil:', e);
			}
		}
	}

	setPhoto(dataUrl: string | null) {
		this.save({ photoUrl: dataUrl });
	}

	reset() {
		this.profile = { ...DEFAULT_PROFILE };
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
	}
}

export const developerStore = new DeveloperStore();
