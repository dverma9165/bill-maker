import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FileText, List, LayoutDashboard, User, Search, Hexagon } from 'lucide-react';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside className="no-print sidebar" style={{
        width: '260px', 
        backgroundColor: 'var(--bg-sidebar)', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
        zIndex: 20
      }}>
        {/* Logo Section */}
        <div style={{ 
          padding: '24px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #818cf8)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)'
          }}>
            <Hexagon size={24} color="white" fill="rgba(255,255,255,0.2)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', letterSpacing: '-0.025em' }}>BillMaker</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Pro Edition</span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: '24px 16px', flex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginLeft: '12px' }}>
            Main Menu
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <NavLink 
              to="/create" 
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                color: isActive ? 'white' : '#cbd5e1', 
                textDecoration: 'none', 
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? '600' : '500'
              })}
            >
              {({ isActive }) => (
                <>
                  <FileText size={20} color={isActive ? '#818cf8' : 'currentColor'} />
                  Create Invoice
                </>
              )}
            </NavLink>
            <NavLink 
              to="/view" 
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                color: isActive ? 'white' : '#cbd5e1', 
                textDecoration: 'none', 
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? '600' : '500'
              })}
            >
              {({ isActive }) => (
                <>
                  <List size={20} color={isActive ? '#818cf8' : 'currentColor'} />
                  All Invoices
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* User Profile */}
        <div style={{ 
          padding: '20px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer'
        }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>Admin User</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>admin@billmaker.app</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header className="glass-header no-print app-header" style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}>
          <div className="mobile-brand">
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), #818cf8)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Hexagon size={18} color="white" fill="rgba(255,255,255,0.2)" />
            </div>
            <span style={{ fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>BillMaker</span>
          </div>

          <div className="header-search" style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', width: '300px' }}>
            <Search size={18} color="#64748b" />
            <input type="text" placeholder="Search invoices..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%', color: '#334155' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span className="header-username" style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>Admin</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>A</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="no-print app-footer" style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          <div>&copy; {new Date().getFullYear()} BillMaker Pro. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ cursor: 'pointer' }} onMouseOver={e=>e.target.style.color='var(--primary)'} onMouseOut={e=>e.target.style.color='var(--text-muted)'}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }} onMouseOver={e=>e.target.style.color='var(--primary)'} onMouseOut={e=>e.target.style.color='var(--text-muted)'}>Terms of Service</span>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav no-print">
          <NavLink to="/create" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
            <FileText size={22} />
            <span>Create</span>
          </NavLink>
          <NavLink to="/view" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
            <List size={22} />
            <span>Invoices</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
