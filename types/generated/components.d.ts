import type { Schema, Struct } from '@strapi/strapi';

export interface ProfileExperience extends Struct.ComponentSchema {
  collectionName: 'components_profile_experiences';
  info: {
    displayName: 'Experience';
    icon: 'briefcase';
  };
  attributes: {
    description: Schema.Attribute.Text;
    period: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedListItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_list_items';
  info: {
    displayName: 'List Item';
    icon: 'bulletList';
  };
  attributes: {
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedTable extends Struct.ComponentSchema {
  collectionName: 'components_shared_tables';
  info: {
    displayName: 'Table';
    icon: 'table';
  };
  attributes: {
    columns: Schema.Attribute.Component<'shared.table-column', true> &
      Schema.Attribute.Required;
    title: Schema.Attribute.String;
  };
}

export interface SharedTableCell extends Struct.ComponentSchema {
  collectionName: 'components_shared_table_cells';
  info: {
    displayName: 'Table Cell';
    icon: 'bulletList';
  };
  attributes: {
    value: Schema.Attribute.Text;
  };
}

export interface SharedTableColumn extends Struct.ComponentSchema {
  collectionName: 'components_shared_table_columns';
  info: {
    displayName: 'Table Column';
    icon: 'heading';
  };
  attributes: {
    header: Schema.Attribute.String & Schema.Attribute.Required;
    values: Schema.Attribute.Component<'shared.table-cell', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'profile.experience': ProfileExperience;
      'shared.list-item': SharedListItem;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.table': SharedTable;
      'shared.table-cell': SharedTableCell;
      'shared.table-column': SharedTableColumn;
    }
  }
}
