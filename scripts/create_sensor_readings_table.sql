CREATE TABLE farmtech_sensor_readings (
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    device_id VARCHAR2(80) NOT NULL,
    cultura VARCHAR2(80) NOT NULL,
    umidade_percent NUMBER(5, 2) NOT NULL,
    temperatura_c NUMBER(5, 2) NOT NULL,
    ph NUMBER(4, 2) NOT NULL,
    n_presente NUMBER(1) NOT NULL CHECK (n_presente IN (0, 1)),
    p_presente NUMBER(1) NOT NULL CHECK (p_presente IN (0, 1)),
    k_presente NUMBER(1) NOT NULL CHECK (k_presente IN (0, 1)),
    limiar_umidade_percent NUMBER(5, 2) NOT NULL,
    bomba_ligada NUMBER(1) NOT NULL CHECK (bomba_ligada IN (0, 1))
);

CREATE INDEX idx_farmtech_sensor_created_at
    ON farmtech_sensor_readings (created_at DESC);

CREATE INDEX idx_farmtech_sensor_device
    ON farmtech_sensor_readings (device_id, created_at DESC);
