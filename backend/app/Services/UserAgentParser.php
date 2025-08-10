<?php

namespace App\Services;

class UserAgentParser
{
    /**
     * Parse user agent string to extract device and OS information
     */
    public static function parse(?string $userAgent): array
    {
        if (empty($userAgent)) {
            return [
                'device' => 'Unknown Device',
                'os' => 'Unknown OS',
                'browser' => 'Unknown Browser',
                'combined' => 'Unknown Device'
            ];
        }

        $device = self::parseDevice($userAgent);
        $os = self::parseOS($userAgent);
        $browser = self::parseBrowser($userAgent);
        
        // Create a concise, user-friendly device description
        $combined = self::createDeviceDescription($browser, $os, $device);

        return [
            'device' => $device,
            'os' => $os,
            'browser' => $browser,
            'combined' => $combined
        ];
    }

    /**
     * Parse device type from user agent
     */
    private static function parseDevice(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);

        // Mobile devices
        if (preg_match('/iphone/', $userAgent)) {
            return 'iPhone';
        }
        if (preg_match('/ipad/', $userAgent)) {
            return 'iPad';
        }
        if (preg_match('/android.*mobile/', $userAgent)) {
            return 'Android Phone';
        }
        if (preg_match('/android/', $userAgent)) {
            return 'Android Tablet';
        }
        if (preg_match('/blackberry/', $userAgent)) {
            return 'BlackBerry';
        }
        if (preg_match('/windows phone/', $userAgent)) {
            return 'Windows Phone';
        }

        // Tablets
        if (preg_match('/tablet/', $userAgent)) {
            return 'Tablet';
        }

        // Desktop/Laptop
        if (preg_match('/macintosh|mac os x/', $userAgent)) {
            return 'Mac';
        }
        if (preg_match('/windows/', $userAgent)) {
            return 'Windows PC';
        }
        if (preg_match('/linux/', $userAgent)) {
            return 'Linux PC';
        }
        if (preg_match('/cros/', $userAgent)) {
            return 'Chromebook';
        }

        return 'Desktop';
    }

    /**
     * Parse operating system from user agent
     */
    private static function parseOS(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);

        // iOS
        if (preg_match('/os (\d+)[_.](\d+)/', $userAgent, $matches)) {
            return "iOS {$matches[1]}.{$matches[2]}";
        }
        if (preg_match('/iphone os (\d+)[_.](\d+)/', $userAgent, $matches)) {
            return "iOS {$matches[1]}.{$matches[2]}";
        }

        // Android
        if (preg_match('/android (\d+\.?\d*)/', $userAgent, $matches)) {
            return "Android {$matches[1]}";
        }

        // Windows
        if (preg_match('/windows nt (\d+\.\d+)/', $userAgent, $matches)) {
            $version = $matches[1];
            $windowsVersions = [
                '10.0' => 'Windows 11',
                '6.3' => 'Windows 8.1',
                '6.2' => 'Windows 8',
                '6.1' => 'Windows 7',
                '6.0' => 'Windows Vista',
                '5.1' => 'Windows XP',
            ];
            return $windowsVersions[$version] ?? "Windows NT {$version}";
        }
        if (preg_match('/windows phone os (\d+\.\d+)/', $userAgent, $matches)) {
            return "Windows Phone {$matches[1]}";
        }

        // macOS
        if (preg_match('/mac os x (\d+)[_.](\d+)/', $userAgent, $matches)) {
            $major = intval($matches[1]);
            $minor = intval($matches[2]);
            
            // macOS version names
            if ($major >= 11) {
                return "macOS {$major}.{$minor}";
            } elseif ($major == 10) {
                $macVersions = [
                    15 => 'macOS Catalina',
                    14 => 'macOS Mojave',
                    13 => 'macOS High Sierra',
                    12 => 'macOS Sierra',
                    11 => 'OS X El Capitan',
                    10 => 'OS X Yosemite',
                    9 => 'OS X Mavericks',
                ];
                return $macVersions[$minor] ?? "macOS 10.{$minor}";
            }
        }

        // Linux
        if (preg_match('/ubuntu/', $userAgent)) {
            return 'Ubuntu Linux';
        }
        if (preg_match('/fedora/', $userAgent)) {
            return 'Fedora Linux';
        }
        if (preg_match('/debian/', $userAgent)) {
            return 'Debian Linux';
        }
        if (preg_match('/linux/', $userAgent)) {
            return 'Linux';
        }

        // Chrome OS
        if (preg_match('/cros/', $userAgent)) {
            return 'Chrome OS';
        }

        return 'Unknown OS';
    }

    /**
     * Parse browser from user agent
     */
    private static function parseBrowser(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);

        // Edge (must be before Chrome check)
        if (preg_match('/edg\/(\d+)/', $userAgent, $matches)) {
            return "Microsoft Edge {$matches[1]}";
        }

        // Chrome (must be before Safari check)
        if (preg_match('/chrome\/(\d+)/', $userAgent, $matches)) {
            return "Chrome {$matches[1]}";
        }

        // Firefox
        if (preg_match('/firefox\/(\d+)/', $userAgent, $matches)) {
            return "Firefox {$matches[1]}";
        }

        // Safari
        if (preg_match('/safari\//', $userAgent) && preg_match('/version\/(\d+)/', $userAgent, $matches)) {
            return "Safari {$matches[1]}";
        }

        // Opera
        if (preg_match('/opera\/(\d+)/', $userAgent, $matches)) {
            return "Opera {$matches[1]}";
        }
        if (preg_match('/opr\/(\d+)/', $userAgent, $matches)) {
            return "Opera {$matches[1]}";
        }

        // Internet Explorer
        if (preg_match('/msie (\d+)/', $userAgent, $matches)) {
            return "Internet Explorer {$matches[1]}";
        }
        if (preg_match('/trident.*rv:(\d+)/', $userAgent, $matches)) {
            return "Internet Explorer {$matches[1]}";
        }

        return 'Unknown Browser';
    }

    /**
     * Create a concise, user-friendly device description
     */
    private static function createDeviceDescription(string $browser, string $os, string $device): string
    {
        // Extract browser name without version for conciseness
        $browserName = preg_replace('/\s+\d+.*$/', '', $browser);
        
        // Extract OS name without detailed version for conciseness
        $osName = $os;
        if (preg_match('/^(iOS|Android|Windows|macOS|Linux|Chrome OS)/', $os, $matches)) {
            $osName = $matches[1];
        }

        // Create concise description
        if ($device === 'iPhone' || $device === 'iPad') {
            return "{$browserName} on {$device} ({$osName})";
        } elseif (strpos($device, 'Android') !== false) {
            return "{$browserName} on {$device} ({$osName})";
        } elseif ($device === 'Mac' || $device === 'Windows PC' || $device === 'Linux PC') {
            return "{$browserName} on {$osName}";
        } else {
            return "{$browserName} on {$device}";
        }
    }
}
