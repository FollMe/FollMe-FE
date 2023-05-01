import { useState, createContext } from "react";

const UserInfoContext = createContext();

const initUserInfo = JSON.parse(localStorage.getItem('userInfo')) ?? {};

const UserInfoProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(initUserInfo);

  return (
    <UserInfoContext.Provider value={{ userInfo, setUserInfo }} >
      {children}
    </UserInfoContext.Provider>
  )
}

export { UserInfoContext, UserInfoProvider };