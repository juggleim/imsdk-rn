import { fetchData } from './client';

export interface GroupMember {
    user_id: string;
    nickname: string;
    avatar: string;
    member_type: number; // 0:普通用户；1：机器人；
    role: number; // 0:群成员；1：群主；2：群管理员
}

export interface GroupInfo {
    group_id: string;
    group_name: string;
    group_portrait: string;
    member_count: number;
    members: GroupMember[];
    owner: {
        user_id: string;
        nickname: string;
        avatar: string;
    };
    my_role: number; // 0：普通群成员；1：群主；2：群管理员；
    group_management: {
        group_mute: number;
        max_admin_count: number;
        admin_count: number;
        group_verify_type: number;
    };
    grp_display_name: string;
}

export async function getGroupInfo(group_id: string): Promise<GroupInfo> {
    return fetchData<GroupInfo>({
        url: '/jim/groups/info',
        method: 'GET',
        params: {
            group_id
        }
    });
}
