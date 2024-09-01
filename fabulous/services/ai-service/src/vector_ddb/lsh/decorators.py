from functools import wraps

def require_rv_table_name(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        if not self.rv_table_name:
            raise ValueError("Random vectors table name not provided")
        return func(self, *args, **kwargs)
    return wrapper

def require_v_table_name(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        if not self.v_table_name:
            raise ValueError("Vectors table name not provided")
        return func(self, *args, **kwargs)
    return wrapper


def require_counter_table_name(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        if not self.counter_table_name:
            raise ValueError("Counter table name not provided")
        return func(self, *args, **kwargs)
    return wrapper