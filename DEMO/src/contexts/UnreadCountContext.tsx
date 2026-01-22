import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import JuggleIM from 'juggleim-rnsdk';

interface UnreadCountContextType {
  totalUnread: number;
  setTotalUnread: (count: number) => void;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export const UnreadCountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    // 首次加载时获取总未读数
    const loadInitialUnreadCount = async () => {
      try {
        const count = await JuggleIM.getTotalUnreadCount();
        setTotalUnread(count);
        console.log('Initial total unread count:', count);
      } catch (error) {
        console.error('Failed to load initial unread count:', error);
      }
    };

    loadInitialUnreadCount();

    // 监听总未读数变化
    const removeListener = JuggleIM.addConversationListener(
      'UnreadCountProvider',
      {
        onTotalUnreadMessageCountUpdate: count => {
          console.log('Total unread count updated:', count);
          setTotalUnread(count);
        },
      }
    );

    return () => {
      removeListener();
    };
  }, []);

  return (
    <UnreadCountContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </UnreadCountContext.Provider>
  );
};

export const useUnreadCount = () => {
  const context = useContext(UnreadCountContext);
  if (!context) {
    throw new Error('useUnreadCount must be used within UnreadCountProvider');
  }
  return context;
};
