package com.juggleim;

import com.facebook.react.bridge.*;

import java.lang.reflect.Field;
import java.util.*;

/**
 * 通用的 Java ↔ React Native 类型转换工具
 * 支持嵌套对象、List、Map、基础类型。
 */
public class RNTypeConverter {

    // === 对象 -> WritableMap ===
    public static WritableMap toWritableMap(Object obj) {
        WritableMap map = new WritableNativeMap();
        if (obj == null) return map;

        try {
            for (Field field : obj.getClass().getDeclaredFields()) {
                field.setAccessible(true);
                Object value = field.get(obj);
                if (value == null) continue;
                putValue(map, field.getName(), value);
            }
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }

        return map;
    }

    private static void putValue(WritableMap map, String key, Object value) {
        if (value instanceof String) {
            map.putString(key, (String) value);
        } else if (value instanceof Integer) {
            map.putInt(key, (Integer) value);
        } else if (value instanceof Double) {
            map.putDouble(key, (Double) value);
        } else if (value instanceof Float) {
            map.putDouble(key, ((Float) value).doubleValue());
        } else if (value instanceof Long) {
            map.putDouble(key, ((Long) value).doubleValue());
        } else if (value instanceof Boolean) {
            map.putBoolean(key, (Boolean) value);
        } else if (value instanceof List) {
            WritableArray array = new WritableNativeArray();
            for (Object item : (List<?>) value) {
                if (item == null) continue;
                if (isPrimitive(item)) {
                    putArrayValue(array, item);
                } else {
                    array.pushMap(toWritableMap(item));
                }
            }
            map.putArray(key, array);
        } else if (value instanceof Map) {
            WritableMap nested = new WritableNativeMap();
            Map<?, ?> vMap = (Map<?, ?>) value;
            for (Map.Entry<?, ?> entry : vMap.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    putValue(nested, entry.getKey().toString(), entry.getValue());
                }
            }
            map.putMap(key, nested);
        } else {
            // 嵌套对象
            map.putMap(key, toWritableMap(value));
        }
    }

    private static void putArrayValue(WritableArray array, Object value) {
        if (value instanceof String) array.pushString((String) value);
        else if (value instanceof Boolean) array.pushBoolean((Boolean) value);
        else if (value instanceof Integer) array.pushInt((Integer) value);
        else if (value instanceof Double)
            array.pushDouble((Double) value);
        else if (value instanceof Float)
            array.pushDouble(((Float) value).doubleValue());
        else if (value instanceof Long)
            array.pushDouble(((Long) value).doubleValue());
    }

    private static boolean isPrimitive(Object obj) {
        return obj instanceof String || obj instanceof Number || obj instanceof Boolean;
    }

    // === ReadableMap -> 对象 ===
    public static <T> T fromReadableMap(ReadableMap map, Class<T> clazz) {
        try {
            T instance = clazz.newInstance();
            ReadableMapKeySetIterator iterator = map.keySetIterator();

            while (iterator.hasNextKey()) {
                String key = iterator.nextKey();
                Field field;
                try {
                    field = clazz.getDeclaredField(key);
                } catch (NoSuchFieldException e) {
                    continue; // 跳过未定义字段
                }
                field.setAccessible(true);

                ReadableType type = map.getType(key);
                switch (type) {
                    case String:
                        field.set(instance, map.getString(key));
                        break;
                    case Number:
                        Class<?> fieldType = field.getType();
                        double num = map.getDouble(key);
                        if (fieldType == int.class || fieldType == Integer.class)
                            field.set(instance, (int) num);
                        else if (fieldType == long.class || fieldType == Long.class)
                            field.set(instance, (long) num);
                        else if (fieldType == float.class || fieldType == Float.class)
                            field.set(instance, (float) num);
                        else
                            field.set(instance, num);
                        break;
                    case Boolean:
                        field.set(instance, map.getBoolean(key));
                        break;
                    case Map:
                        Object nestedObj = fromReadableMap(map.getMap(key), field.getType());
                        field.set(instance, nestedObj);
                        break;
                    case Array:
                        ReadableArray array = map.getArray(key);
                        List<Object> list = new ArrayList<>();

                        for (int i = 0; i < array.size(); i++) {
                            ReadableType elementType = array.getType(i);
                            switch (elementType) {
                                case String:
                                    list.add(array.getString(i));
                                    break;
                                case Number:
                                    list.add(array.getDouble(i));
                                    break;
                                case Boolean:
                                    list.add(array.getBoolean(i));
                                    break;
                                case Map:
                                    list.add(fromReadableMap(array.getMap(i), Object.class));
                                    break;
                                default:
                                    break;
                            }
                        }

                        field.set(instance, list);
                        break;
                }
            }

            return instance;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
