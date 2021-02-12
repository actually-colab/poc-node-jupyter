def fib(n):
    """
    A recursive implementation of finding the nth number in the fibonacci sequence
    """
    if n <= 1:
        return n

    return fib(n - 1) + fib(n - 2)


print(fib(10))
