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
                type: 'basic',
                icon: 'heroicons_outline:calendar',
                link: '/planejamento/diario',
            },
            {
                id: 'metas',
                title: 'Metas',
                type: 'basic',
                icon: 'heroicons_outline:flag',
                link: '/metas',
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
                        id: 'refeicoes.minhas-refeicoes',
                        title: 'Minhas Refeições',
                        type: 'basic',
                        link: '/planejamento/minhas-refeicoes',
                    },
                ],
            }
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
