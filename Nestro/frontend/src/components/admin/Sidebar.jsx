"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdDashboard, MdCategory, MdOutlineInventory, MdMenu, MdMeetingRoom } from 'react-icons/md';
import { FaShoppingCart, FaUsers, FaTags, FaReceipt, FaEnvelopeOpenText } from 'react-icons/fa';

const menuItems = [
  { name: 'Dashboard', icon: MdDashboard, path: '/admin', exact: true },
  { name: 'Orders', icon: FaShoppingCart, path: '/admin/orders' },
  { name: 'Transactions', icon: FaReceipt, path: '/admin/transactions' },
  { name: 'Products', icon: MdOutlineInventory, path: '/admin/products' },
  { name: 'Categories', icon: MdCategory, path: '/admin/category' },
  { name: 'Rooms', icon: MdMeetingRoom, path: '/admin/room_type' },
  { name: 'Coupons', icon: FaTags, path: '/admin/coupons' },
  { name: 'Customers', icon: FaUsers, path: '/admin/customers' },
  { name: 'Enquiries', icon: FaEnvelopeOpenText, path: '/admin/enquiries' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (item) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} shrink-0 bg-gray-900 text-white flex flex-col h-full transition-all duration-300`}>
      <div className={`h-16 flex items-center border-b border-gray-800 transition-all ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
        {!isCollapsed && (
          <span className="text-xl font-semibold tracking-[0.12em] uppercase text-white whitespace-nowrap">
            Nestro<span className="text-[#C6A27E]">.</span>
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white transition-colors"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <MdMenu className="text-2xl" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 py-2.5 rounded-lg transition-colors group ${
                    active ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon className={`text-xl shrink-0 transition-colors ${active ? 'text-[#C6A27E]' : 'group-hover:text-[#C6A27E]'}`} />
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="border-t border-gray-800 p-4">
          <Link href="/" target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">
            View storefront ↗
          </Link>
        </div>
      )}
    </aside>
  );
}
