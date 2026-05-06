/**
 * Module Profiles - Profils citoyens avec 7 fonctionnalités étendues (100% plateforme)
 * - Core: CRUD profils, followers, localisation
 * - Privacy: Visibilité/confidentialité des profils
 * - Reputation: Système de réputation et badges
 * - Dynamic Fields: Champs personnalisés extensibles
 * - Preferences: Préférences de contenu et notifications
 * - Search: Recherche avancée full-text avec scoring
 * - Versioning: Audit trail et historique des modifications
 */

module.exports = {
  routes: require('./routes'),
  controller: require('./controller'),
  service: require('./service'),
  extendedController: require('./extended.controller'),

  // Services étendus
  PrivacyService: require('./privacy.service').PrivacyService,
  ReputationService: require('./reputation.service').ReputationService,
  DynamicFieldsService: require('./dynamicfields.service').DynamicFieldsService,
  PreferencesService: require('./preferences.service').PreferencesService,
  ProfileSearchService: require('./search.service').ProfileSearchService,
  ProfileVersioningService: require('./versioning.service').ProfileVersioningService,
};
