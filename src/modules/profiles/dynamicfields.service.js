/**
 * Dynamic Fields Service — Gestion des champs personnalisés
 */

const db = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');

class DynamicFieldsService {
  /**
   * Créer une définition de champ
   */
  static async createFieldDefinition(data) {
    const result = await db.query(
      `INSERT INTO profile_field_definitions
       (field_key, field_name, field_type, field_description, is_visible_in_profile, is_searchable, validation_rules, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.fieldKey,
        data.fieldName,
        data.fieldType,
        data.fieldDescription || null,
        data.isVisibleInProfile !== false,
        data.isSearchable || false,
        data.validationRules ? JSON.stringify(data.validationRules) : null,
        data.displayOrder || 0,
      ]
    );

    return result.rows[0];
  }

  /**
   * Mettre à jour un champ dynamique
   */
  static async updateField(profileId, fieldKey, fieldValue, visibility = 'public') {
    // Vérifier que la définition existe
    const defResult = await db.query(
      `SELECT id FROM profile_field_definitions WHERE field_key = $1`,
      [fieldKey]
    );

    if (defResult.rows.length === 0) {
      throw new AppError('Field definition not found', 404);
    }

    const fieldDefinitionId = defResult.rows[0].id;

    // Insérer ou mettre à jour
    const result = await db.query(
      `INSERT INTO profile_fields (profile_id, field_definition_id, field_key, field_value, visibility)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (profile_id, field_key)
       DO UPDATE SET field_value = $4, visibility = $5, updated_at = NOW()
       RETURNING *`,
      [profileId, fieldDefinitionId, fieldKey, fieldValue, visibility]
    );

    return result.rows[0];
  }

  /**
   * Récupérer les champs dynamiques d'un profil
   */
  static async getFields(profileId, viewerId = null) {
    let query = `
      SELECT pf.id, pf.field_key as fieldKey, pf.field_value as fieldValue,
             pf.visibility, pfd.field_name as fieldName, pfd.field_type as fieldType
      FROM profile_fields pf
      JOIN profile_field_definitions pfd ON pf.field_definition_id = pfd.id
      WHERE pf.profile_id = $1
    `;

    const params = [profileId];

    // Filtrer par visibilité si différent du propriétaire
    if (viewerId !== profileId) {
      query += ` AND pf.visibility = 'public'`;
    }

    query += ` ORDER BY pfd.display_order ASC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Mettre à jour plusieurs champs à la fois
   */
  static async updateFields(profileId, fields) {
    const updated = [];

    for (const field of fields) {
      const result = await this.updateField(profileId, field.fieldKey, field.fieldValue, field.visibility);
      updated.push(result);
    }

    return updated;
  }

  /**
   * Supprimer un champ
   */
  static async deleteField(profileId, fieldKey) {
    const result = await db.query(
      `DELETE FROM profile_fields
       WHERE profile_id = $1 AND field_key = $2
       RETURNING field_key`,
      [profileId, fieldKey]
    );

    if (result.rows.length === 0) {
      throw new AppError('Field not found', 404);
    }

    return result.rows[0];
  }

  /**
   * Récupérer toutes les définitions de champs
   */
  static async getFieldDefinitions() {
    const result = await db.query(
      `SELECT id, field_key as fieldKey, field_name as fieldName, field_type as fieldType,
              field_description as fieldDescription, is_visible_in_profile as isVisibleInProfile,
              is_searchable as isSearchable, validation_rules as validationRules, display_order as displayOrder
       FROM profile_field_definitions
       ORDER BY display_order ASC`
    );

    return result.rows;
  }
}

module.exports = { DynamicFieldsService };
