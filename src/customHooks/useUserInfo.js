import { useContext } from 'react';
import { UserInfoContext } from '../contexts';

function useUserInfo() {
    const { userInfo, setUserInfo } = useContext(UserInfoContext);
    return [ userInfo, setUserInfo ];
}

export { useUserInfo }