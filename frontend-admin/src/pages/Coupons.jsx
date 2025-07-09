import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.getCoupons();
      setCoupons(response.data.coupons || []);
    } catch (err) {
      console.error('Erro ao buscar cupons:', err);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Cupons de Desconto</h1>
        <button 
          style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Novo Cupom
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Código</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Valor</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  Nenhum cupom encontrado
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {coupon.code}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {coupon.type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {coupon.type === 'percentage' 
                      ? `${coupon.value}%` 
                      : `R$ ${coupon.value.toFixed(2)}`
                    }
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: coupon.isActive ? '#dcfce7' : '#fecaca',
                      color: coupon.isActive ? '#166534' : '#991b1b'
                    }}>
                      {coupon.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
