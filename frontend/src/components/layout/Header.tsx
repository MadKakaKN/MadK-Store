import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-600/30">
                M
              </span>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                MadK<span className="text-brand-600">Store</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <Link to="/" className="hover:text-brand-600 transition-colors">
              Trang chủ
            </Link>
            <Link to="/#categories" className="hover:text-brand-600 transition-colors">
              Sản phẩm
            </Link>
            <Link to="/#deals" className="hover:text-brand-600 transition-colors">
              Khuyến mãi
            </Link>
            <Link to="/#about" className="hover:text-brand-600 transition-colors">
              Chính sách
            </Link>
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/cart"
              className="p-2 text-slate-700 hover:text-brand-600 relative transition-colors"
              title="Giỏ hàng"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </Link>

            <Link
              to="/auth/login"
              className="px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            >
              Đăng nhập
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/cart"
              className="p-2 text-slate-700 relative"
              title="Giỏ hàng"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-800 hover:text-brand-600"
          >
            Trang chủ
          </Link>
          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-800 hover:text-brand-600"
          >
            Giỏ hàng
          </Link>
          <Link
            to="/auth/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-brand-600 font-semibold"
          >
            Đăng nhập / Đăng ký
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
