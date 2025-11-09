
import React from 'react';
import { ProductStatus } from '../../types';

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ status }) => {
  const statusStyles: { [key in ProductStatus]: string } = {
    [ProductStatus.Hot]: 'bg-red-500 text-white',
    [ProductStatus.Interesting]: 'bg-yellow-500 text-gray-900',
    [ProductStatus.Cold]: 'bg-blue-500 text-white',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

export default ProductStatusBadge;
