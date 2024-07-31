import { Container } from "@mui/material";


export const MainBody: React.FC<{
    children?: React.ReactNode;
}> = ({
    children
}) => {
        return (
            <>
                <Container>
                    {children}
                </Container>
            </>
        );
    }