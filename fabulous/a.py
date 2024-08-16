import numpy as np
import json
import sys
import logging


logger = logging.getLogger()
logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()  # StreamHandler logs to console
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

d=100
num_hashes=1024
# a = [np.random.rand(d) for _ in range(num_hashes)]
a = [np.random.rand(d).tolist() for _ in range(num_hashes)]
s_a = json.dumps(a)
size_a = sys.getsizeof(s_a)
logger.info({
    # s_a, 
    "size_a": size_a
})