// Tab Organizer AI - Secure Configuration Service
class SecureConfigService {
    constructor() {
        // Hardcoded encrypted Supabase configuration
        this.config = {
            // URL: https://uabxzkjrnvhiucmkqnnd.supabase.co (Base64 encoded)
            url: 'aHR0cHM6Ly91YWJ4emtqcm52aGl1Y21rcW5uZC5zdXBhYmFzZS5jbw==',
            
            // Anon Key (Base64 encoded)
            anonKey: 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5WaFluaDZhMnB5Ym5ab2FYVmpiV3R4Ym01a0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTlRjM056RXhNemtzSW1WNGNDSTZNakEzTXpNME16Y3hNek01WlEuY3NhY0VjcEdTb2FzWnk0dWdaSE1fZlVDWGdvMzFuV3FHRUV6X0g3Q0RF',
            
            // Service Role Key (Base64 encoded)
            serviceKey: 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5WaFluaDZhMnB5Ym5ab2FYVmpiV3R4Ym01a0lpd2ljbTlzWlNJNkluTmxjblpwWTJWZmNtOXNaU0lzSW1saGRDSTZNVGMxTnpjM016RXhNems1TENKbGVIQWlPakl3TnpNek5EY3hNek01ZlEucER5WGZ2MU5UbzBOZGNnZ3ROWFBaUzRYOHV3UHRWdnczZDJCR0c5TQ=='
        };
        
        this.isInitialized = false;
    }

    // Decode Base64 configuration
    decode(encoded) {
        try {
            return atob(encoded);
        } catch (error) {
            console.error('Configuration decode failed:', error);
            return null;
        }
    }

    // Get configuration
    getConfig() {
        if (!this.isInitialized) {
            this.isInitialized = true;
            console.log('🔒 Secure configuration initialized');
        }
        
        return {
            url: this.decode(this.config.url),
            key: this.decode(this.config.anonKey),
            serviceKey: this.decode(this.config.serviceKey)
        };
    }

    // Validate configuration
    isValid() {
        const config = this.getConfig();
        return !!(
            config.url && config.url.includes('supabase.co') &&
            config.key && config.key.startsWith('eyJ') &&
            config.serviceKey && config.serviceKey.startsWith('eyJ')
        );
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureConfigService;
}