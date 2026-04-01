import React from 'react';
import { Link } from 'react-router-dom';
import { HeadphonesIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationsDropdown from '@/components/layout/NotificationsDropdown';
import MessagesDropdown from '@/components/layout/MessagesDropdown';
import UserDropdown from '@/components/layout/header/UserDropdown';
import LoginDropdown from '@/components/layout/header/LoginDropdown';
import { Button } from '@tgt/ui-web';


const UserActions: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="hidden md:flex items-center gap-3">
                <div className="h-4 w-20 bg-gray-100 animate-pulse rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="hidden md:flex items-center gap-2 lg:gap-4 font-semibold text-[13px]">
            {!user && (
                <>
                    <Link to="/ajuda" className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-all pr-1">
                        <HeadphonesIcon className="w-4 h-4" />
                        <span>Suporte</span>
                    </Link>

                    <div className="h-5 w-[1px] bg-slate-200/60 mx-1" />

                    <LoginDropdown />

                    <Link to="/cadastro/cliente">
                        <Button
                            className="rounded-full px-7 h-10 text-[11px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-[1.03] bg-[#04B4E0] hover:bg-[#039BBF] text-white border-none"
                        >
                            Cadastrar
                        </Button>
                    </Link>

                    <Link to="/waitlist" className="hidden lg:block">
                        <Button variant="outline" className="rounded-full px-7 h-10 text-[11px] font-black uppercase tracking-wider border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:border-slate-300">
                            Waitlist
                        </Button>
                    </Link>
                </>
            )}

            {user && (
                <div className="flex items-center gap-2 sm:gap-3">
                    <MessagesDropdown />
                    <NotificationsDropdown />
                    <UserDropdown />
                </div>
            )}
        </div>
    );
};

export default UserActions;
