import React from 'react';
import KanbanBoard from '../components/Kanban/KanbanBoard';
import NotificationSystem from '../components/Kanban/NotificationSystem';

const OrdersKanban = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <KanbanBoard />
      <NotificationSystem />
    </div>
  );
};

export default OrdersKanban;
