# V2 Features (Disabled)

These files contain V2 feature implementations that are complete but intentionally
disabled for the V1 launch. They are preserved here for future activation.

## Components

- **SharingAnalytics** - Privacy-first usage analytics dashboard
- **CampsiteRecommendations** - AI-powered campsite recommendations
- **FeedbackSystem** - Bug reports, feature requests, and ratings
- **TripSharing** - Share trips with other users
- **SharedTripImporter** - Import shared trips

## Services

- **CampsiteRecommendationService** - Campsite recommendation algorithms
- **TollCalculationService** - European toll cost estimation
- **TripSharingService** - Trip sharing and collaboration
- **TripTemplatesService** - Pre-built trip templates

## Utils

- **analytics** - Usage tracking utilities
- **qrcode** - QR code generation for trip sharing

## Reactivation

To reactivate a feature:
1. Move the file back to its original location in `src/`
2. Enable the corresponding feature flag in `src/config/features.ts`
3. Wire up the component/service imports
4. Test thoroughly before shipping
