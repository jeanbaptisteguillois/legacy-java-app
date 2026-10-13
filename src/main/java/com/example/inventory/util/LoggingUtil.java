package com.example.inventory.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Thin wrapper around the SLF4J {@code org.slf4j.Logger} API.
 *
 * <p>Backed by Logback through {@code spring-boot-starter-logging}. Previously
 * this returned an {@code org.apache.log4j.Logger} obtained through the
 * {@code log4j-1.2-api} bridge; the method name and parameter are unchanged, so
 * all existing call sites keep compiling and emit the same messages.</p>
 */
public final class LoggingUtil {

    private LoggingUtil() {
    }

    public static Logger getLogger(Class<?> clazz) {
        return LoggerFactory.getLogger(clazz);
    }
}
