export interface User {
    id: string;
    nome: string;
    email: string;
    avatar?: string;
    status?: string;
    preRegister?: boolean;
    altura?: number;
    peso?: number;
    idade?: number;
    sexo?: 'MASCULINO' | 'FEMININO';
    nivelAtividade?: 'SEDENTARIO' | 'LEVE' | 'MODERADO' | 'INTENSO' | 'ATLETA';
    objetivoDieta?: 'PERDER_PESO' | 'MANTER_PESO' | 'GANHAR_MASSA';
}

export interface SignUpRequest {
    nome: string;
    email: string;
    senha: string;
}

export interface SignInRequest {
    email: string;
    senha: string;
}

export interface SignInResponse {
    token: string;
    user: User;
}

export interface UpdateUserRequest {
    nome?: string;
    email?: string;
    senha?: string;
    altura?: number;
    peso?: number;
    idade?: number;
    sexo?: 'MASCULINO' | 'FEMININO';
    nivelAtividade?: 'SEDENTARIO' | 'LEVE' | 'MODERADO' | 'INTENSO' | 'ATLETA';
    objetivoDieta?: 'PERDER_PESO' | 'MANTER_PESO' | 'GANHAR_MASSA';
    preRegister?: boolean;
    status?: string;
}
