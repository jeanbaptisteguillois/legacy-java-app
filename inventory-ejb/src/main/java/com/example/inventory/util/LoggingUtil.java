package com.example.inventory.util;

import org.apache.log4j.Logger;

/**
 * Thin wrapper around the Log4j {@code org.apache.log4j.Logger} API.
 *
 * <p>Backed by Log4j 2 through the {@code log4j-1.2-api} bridge, so the
 * existing logging call sites remain unchanged while the EOL Log4j 1.x
 * implementation is no longer used.</p>
 */
public final class LoggingUtil {

    private LoggingUtil() {
    }

    public static Logger getLogger(Class<?> clazz) {
        return Logger.getLogger(clazz);
    }
}
