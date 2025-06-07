/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id: 'aplicativos',
        title: 'Opções',
        subtitle: 'Selecione um item do menu',
        type: 'group',
        icon: 'heroicons_outline:home',
        children: [
            {
                id: 'home',
                title: 'Início',
                type: 'basic',
                icon: 'heroicons_outline:home',
                link: '/home',
            },
            {
                id: 'planejamento',
                title: 'Planejamento',
                type: 'collapsable',
                icon: 'heroicons_outline:calendar',
                children: [
                    {
                        id: 'planejamento.semanal',
                        title: 'Semanal',
                        type: 'basic',
                        link: '/planejamento/semanal',
                    },
                    {
                        id: 'planejamento.diario',
                        title: 'Diário',
                        type: 'basic',
                        link: '/planejamento/diario',
                    },
                    {
                        id: 'planejamento.minhas-refeicoes',
                        title: 'Minhas Refeições',
                        type: 'basic',
                        link: '/planejamento/minhas-refeicoes',
                    },
                ],
            },
            {
                id: 'refeicoes',
                title: 'Refeições',
                type: 'collapsable',
                icon: 'heroicons_outline:cake',
                children: [
                    {
                        id: 'refeicoes.adicionar',
                        title: 'Refeição',
                        type: 'basic',
                        link: '/refeicoes/adicionar',
                    },
                    {
                        id: 'refeicoes.historico',
                        title: 'Plano Alimentar',
                        type: 'basic',
                        link: '/refeicoes/historico',
                    },
                    {
                        id: 'refeicoes.preferencias',
                        title: 'Minhas Preferências',
                        type: 'basic',
                        link: '/refeicoes/preferencias',
                    },
                ],
            },
            {
                id: 'saude',
                title: 'Saúde',
                type: 'collapsable',
                icon: 'heroicons_outline:heart',
                children: [
                    {
                        id: 'saude.dados-corporais',
                        title: 'Dados corporais',
                        type: 'basic',
                        link: '/saude/dados-corporais',
                    },
                    {
                        id: 'saude.progresso',
                        title: 'Progresso',
                        type: 'basic',
                        link: '/saude/progresso',
                    },
                    {
                        id: 'saude.metas-nutricionais',
                        title: 'Metas nutricionais',
                        type: 'basic',
                        link: '/saude/metas-nutricionais',
                    },
                ],
            },
            {
                id: 'configuracoes',
                title: 'Configurações',
                type: 'collapsable',
                icon: 'heroicons_outline:cog',
                children: [
                    {
                        id: 'configuracoes.preferencias-alimentares',
                        title: 'Preferências alimentares',
                        type: 'basic',
                        link: '/configuracoes/preferencias-alimentares',
                    },
                    {
                        id: 'configuracoes.restricoes',
                        title: 'Restrições',
                        type: 'basic',
                        link: '/configuracoes/restricoes',
                    },
                    {
                        id: 'configuracoes.notificacoes',
                        title: 'Notificações',
                        type: 'basic',
                        link: '/configuracoes/notificacoes',
                    },
                ],
            },
        ],
    },
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Início',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/home'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Início',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/home'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'home',
        title: 'Início',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : '/home'
    }
];
