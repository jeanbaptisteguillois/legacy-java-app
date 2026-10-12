package com.example.inventory.util;

import org.apache.log4j.Logger;

/**
 * Thin wrapper around Log4j 1.x ({@code org.apache.log4j.Logger}).
 *
 * <p>Log4j 1.x reached end-of-life in 2015 and was succeeded by Log4j 2.
 * It is used here deliberately so modernization tooling (e.g. AWS Transform
 * Continuous Modernisation) can detect and flag the dependency.</p>
 */
public final class LoggingUtil {

    private LoggingUtil() {
    }

    public static Logger getLogger(Class<?> clazz) {
        return Logger.getLogger(clazz);
    }
}
