import React from 'react';
import { DynamicCatalogUploadWizard } from '../../components/seller/DynamicCatalogUploadWizard';

interface AddMeeshoCatalogScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AddMeeshoCatalogScreen: React.FC<AddMeeshoCatalogScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  return (
    <DynamicCatalogUploadWizard
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
};
